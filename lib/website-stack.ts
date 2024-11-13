import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as targets from "aws-cdk-lib/aws-route53-targets";

export interface MyWebsiteAppStackProps extends cdk.StackProps {
  environment: string;
  domainName: string;
  bucketName: string;
}

export class MyWebsiteAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MyWebsiteAppStackProps) {
    super(scope, id, props);

    if (!props || !props.domainName || props.domainName == "") {
      throw new Error("The domainName property is not defined.");
    }
    const domainName = props.domainName;
    if (!props || !props.bucketName || props.bucketName == "") {
      throw new Error("The bucketName property is not defined.");
    }
    const bucketName = props.bucketName;

    const bucket = new s3.Bucket(this, "WebsiteBucket", {
      bucketName,
      removalPolicy:
        props.environment != "production"
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: props.environment != "production",
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    bucket.grantRead(originAccessIdentity);

    // We need to create this Zone beforehand because the domain name is not managed by AWS
    const zone =
      props.environment == "test"
        ? new route53.HostedZone(this, "TestZone", { zoneName: "testing" })
        : route53.HostedZone.fromLookup(this, "HostedZone", {
            domainName,
          });

    const certificate = props.environment == "production"
    ? new acm.Certificate(this, "SiteCertificate", {
      domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: {
        method: acm.ValidationMethod.DNS,
        props: { hostedZone: zone },
      },
    }) : null;

    const responseHeaderPolicy = this.createCFResponseHeadersPolicy();

    const distribution = this.createDistribution(
      certificate,
      domainName,
      bucket as s3.Bucket,
      originAccessIdentity,
      responseHeaderPolicy
    );

    // Create a new CNAME record for "www." + domainName pointing to the new distribution
    new route53.CnameRecord(this, "CnameRecord", {
      zone,
      recordName: `www.${domainName}`,
      domainName: distribution.domainName,
      ttl: cdk.Duration.minutes(5),
      deleteExisting: true,
    });

    new route53.ARecord(this, "Alias ARecord", {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      ttl: cdk.Duration.minutes(5),
      deleteExisting: true,
    });

    new cdk.CfnOutput(this, "Domain", { value: `https://www.${domainName}` });
    new cdk.CfnOutput(this, "Bucket name", { value: bucketName });
    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: distribution.distributionDomainName,
    });
  }

  createCFResponseHeadersPolicy(): cloudfront.ResponseHeadersPolicy {
    return new cloudfront.ResponseHeadersPolicy(
      this,
      "SecurityHeadersResponseHeaderPolicy",
      {
        comment: "Security headers response header policy",
        securityHeadersBehavior: {
          strictTransportSecurity: {
            override: true,
            accessControlMaxAge: cdk.Duration.days(2 * 365),
            includeSubdomains: true,
            preload: true,
          },
          contentTypeOptions: {
            override: true,
          },
          referrerPolicy: {
            override: true,
            referrerPolicy:
              cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          },
          xssProtection: {
            override: true,
            protection: true,
            modeBlock: true,
          },
          frameOptions: {
            override: true,
            frameOption: cloudfront.HeadersFrameOption.DENY,
          },
        },
      }
    );
  }

  createDistribution(
    certificate: acm.Certificate,
    domainName: string,
    bucket: s3.Bucket,
    originAccessIdentity: cloudfront.OriginAccessIdentity,
    headersPolicy: cloudfront.ResponseHeadersPolicy
  ): cloudfront.Distribution {
    return new cloudfront.Distribution(this, "CloudFrontDistribution", {
      certificate,
      domainNames: [domainName, `www.${domainName}`],
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
        },
      ],
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        responseHeadersPolicy: headersPolicy,
      },
      enableLogging: true,
      logIncludesCookies: true,
      logFilePrefix: "cloudfront-logs/",
    });
  }
}
