import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";

const assetsPath = "./www";

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
        props?.environment != "production"
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: props?.environment != "production",
    });
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    bucket.grantRead(originAccessIdentity);

    new s3deployment.BucketDeployment(this, "PushFiles", {
      sources: [s3deployment.Source.asset(assetsPath)],
      destinationBucket: bucket,
    });

    const blogTable = this.createDynamoDbTable(props.environment);

    const readBlogFunction = this.createReadLambda();
    const readFunctionUrl = new lambda.FunctionUrl(this, "Read Function URL", {
      function: readBlogFunction,
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: { allowedOrigins: ["*"] },
    }).url;
    const createBlogFunction = this.createUpsertLambda();
    const createFunctionUrl = new lambda.FunctionUrl(
      this,
      "Create Function URL",
      {
        function: createBlogFunction,
        authType: lambda.FunctionUrlAuthType.AWS_IAM,
        cors: { allowedOrigins: ["*"] },
      }
    ).url;

    blogTable.grantReadData(readBlogFunction);
    blogTable.grantReadWriteData(createBlogFunction);

    // We need to create this Zone beforehand because the domain name is not managed by AWS
    const zone =
      props.environment == "test"
        ? new route53.HostedZone(this, "TestZone", { zoneName: "testing" })
        : route53.HostedZone.fromLookup(this, "HostedZone", {
            domainName,
          });

    const certificate = new acm.Certificate(this, "SiteCertificate", {
      domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: {
        method: acm.ValidationMethod.DNS,
        props: { hostedZone: zone },
      },
    });

    const responseHeaderPolicy = this.createCFResponseHeadersPolicy();

    const distribution = this.createDistribution(
      certificate,
      domainName,
      bucket,
      originAccessIdentity,
      responseHeaderPolicy,
      readFunctionUrl,
      createFunctionUrl
    );

    // Create a new CNAME record for "www." + domainName pointing to the new distribution
    new route53.CnameRecord(this, "CnameRecord", {
      zone,
      recordName: `www.${domainName}`,
      domainName: distribution.domainName,
      ttl: cdk.Duration.minutes(5),
      deleteExisting: true,
    });

    new cdk.CfnOutput(this, "Bucket name", { value: bucketName });
    new cdk.CfnOutput(this, "CloudfrontUrl", {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, "Create Lambda URL", { value: createFunctionUrl });
  }

  createDynamoDbTable(environment: string): dynamodb.ITable {
    // Only the production table is stable
    let table: dynamodb.ITable;

    if (environment == "production") {
      table = dynamodb.Table.fromTableName(this, "BlogPostsTable", "BlogPosts");
    }
    table ??= new dynamodb.Table(this, "BlogPosts", {
      tableName: "BlogPosts-" + environment,
      partitionKey: { name: "postId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "created", type: dynamodb.AttributeType.NUMBER },
      removalPolicy:
        environment == "production"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    return table;
  }

  createReadLambda() {
    return new lambda.Function(this, "ReadBlogFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "read.handler",
      code: lambda.Code.fromAsset("lambda"),
    });
  }

  createUpsertLambda() {
    return new lambda.Function(this, "CreateBlogFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "create.handler",
      code: lambda.Code.fromAsset("lambda"),
    });
  }

  createCFResponseHeadersPolicy(): cloudfront.ResponseHeadersPolicy {
    return new cloudfront.ResponseHeadersPolicy(
      this,
      "SecurityHeadersResponseHeaderPolicy",
      {
        comment: "Security headers response header policy",
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            override: true,
            contentSecurityPolicy: "default-src 'self'",
          },
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
    headersPolicy: cloudfront.ResponseHeadersPolicy,
    readFunctionUrl: string,
    createFunctionUrl: string
  ): cloudfront.Distribution {
    return new cloudfront.Distribution(this, "CloudFrontDistribution", {
      certificate,
      domainNames: [domainName, `www.${domainName}`],
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
      defaultRootObject: "index.html",
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
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: headersPolicy,
      },

      additionalBehaviors: {
        "/post": {
          origin: new origins.HttpOrigin(
            cdk.Fn.select(2, cdk.Fn.split("/", createFunctionUrl))
          ),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
        "/posts/*": {
          origin: new origins.HttpOrigin(
            cdk.Fn.select(2, cdk.Fn.split("/", readFunctionUrl))
          ),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      enableLogging: true,
      logIncludesCookies: true,
      logFilePrefix: "cloudfront-logs/",
    });
  }
}
