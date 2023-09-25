import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface MyWebsiteAppStackProps extends cdk.StackProps {
  environment: string;
  domainName: string;
  staticBucketName: string;
}

export class MyWebsiteAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MyWebsiteAppStackProps) {
    super(scope, id, props);

    if (!props || !props.domainName || props.domainName == "") {
      throw new Error("The domainName property is not defined.");
    }
    const domainName = props.domainName;

    if (!props || !props.staticBucketName || props.staticBucketName == "") {
      throw new Error("The staticBucketName property is not defined.");
    }
    const bucketName = props.staticBucketName;

    const blogTable = this.createDynamoDbTable(props.environment);

    const readBlogFunction = this.createReadLambda();
    const createBlogFunction = this.createUpsertLambda();

    blogTable.grantReadData(readBlogFunction);
    blogTable.grantReadWriteData(createBlogFunction);

    const lambdaApiGateway = new apigateway.RestApi(this, "BlogApi");

    const readBlogIntegration = new apigateway.LambdaIntegration(
      readBlogFunction
    );
    const createBlogIntegration = new apigateway.LambdaIntegration(
      createBlogFunction
    );

    lambdaApiGateway.root.addMethod("GET", readBlogIntegration);
    lambdaApiGateway.root.addMethod("POST", createBlogIntegration);

    const assetsBucket = s3.Bucket.fromBucketName(
      this,
      "WebsiteBucket",
      bucketName
    );

    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "CloudFrontOriginAccessIdentity"
    );
    // We need to add this policy explicitly: https://stackoverflow.com/a/60917015/5637762
    this.createCloudfrontBucketPolicy(
      assetsBucket,
      cloudfrontOriginAccessIdentity
    );

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
      assetsBucket,
      cloudfrontOriginAccessIdentity,
      lambdaApiGateway,
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

  createCloudfrontBucketPolicy(
    bucket: s3.IBucket,
    cfOriginAccessIdentity: cloudfront.OriginAccessIdentity
  ) {
    const policyStatement = new iam.PolicyStatement();
    policyStatement.addActions("s3:GetBucket*");
    policyStatement.addActions("s3:GetObject*");
    policyStatement.addActions("s3:List*");
    policyStatement.addResources(bucket.bucketArn);
    policyStatement.addResources(`${bucket.bucketArn}/*`);
    policyStatement.addCanonicalUserPrincipal(
      cfOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    if (!bucket.policy) {
      new s3.BucketPolicy(this, "Policy", { bucket }).document.addStatements(
        policyStatement
      );
    } else {
      bucket.policy.document.addStatements(policyStatement);
    }
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
    bucket: s3.IBucket,
    oai: cloudfront.OriginAccessIdentity,
    apiGateway: apigateway.RestApi,
    headersPolicy: cloudfront.ResponseHeadersPolicy
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
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: headersPolicy,
      },
      additionalBehaviors: {
        "/posts": { origin: new origins.RestApiOrigin(apiGateway) },
        "/posts/*": { origin: new origins.RestApiOrigin(apiGateway) },
      },
      enableLogging: true,
      logIncludesCookies: true,
      logFilePrefix: "cloudfront-logs/",
    });
  }
}
