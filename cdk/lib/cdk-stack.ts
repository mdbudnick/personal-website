import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";


export class MyWebsiteAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    if (!process.env.DOMAIN_NAME) {
      throw new Error('The DOMAIN_NAME environment variable is not defined.');
    }
    const domainName = process.env.DOMAIN_NAME!;
    if (!process.env.BUCKET_NAME) {
      throw new Error('The BUCKET_NAME environment variable is not defined.');
    }
    const bucketName = process.env.BUCKET_NAME;

    super(scope, id, props);

    const blogTable = new dynamodb.Table(this, 'BlogPosts', {
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    const readBlogFunction = new lambda.Function(this, 'ReadBlogFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'readHandler',
      code: lambda.Code.fromAsset('lambda'),
    });

    const createBlogFunction = new lambda.Function(this, 'CreateBlogFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'createHandler',
      code: lambda.Code.fromAsset('lambda'),
    });


    blogTable.grantReadData(readBlogFunction);
    blogTable.grantReadWriteData(createBlogFunction);


    const api = new apigateway.RestApi(this, 'BlogApi');

    const readBlogIntegration = new apigateway.LambdaIntegration(readBlogFunction);
    const createBlogIntegration = new apigateway.LambdaIntegration(createBlogFunction);

    api.root.addMethod('GET', readBlogIntegration);
    api.root.addMethod('POST', createBlogIntegration);

    const assetsBucket = s3.Bucket.fromBucketName(this, 'WebsiteBucket', bucketName);

    new s3deployment.BucketDeployment(this, "StaticSite", {
      sources: [s3deployment.Source.asset('./www.zip')],
      destinationBucket: assetsBucket,
    });

    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity');

    assetsBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [assetsBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName });

    const certificate = new acm.Certificate(this, 'SiteCertificate',
      {
        domainName,
        validation: { method: acm.ValidationMethod.DNS, props: { hostedZone: zone } }
      });

      const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersResponseHeaderPolicy', {
        comment: 'Security headers response header policy',
        securityHeadersBehavior: {
          contentSecurityPolicy: {
            override: true,
            contentSecurityPolicy: "default-src 'self'"
          },
          strictTransportSecurity: {
            override: true,
            accessControlMaxAge: cdk.Duration.days(2 * 365),
            includeSubdomains: true,
            preload: true
          },
          contentTypeOptions: {
            override: true
          },
          referrerPolicy: {
            override: true,
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN
          },
          xssProtection: {
            override: true,
            protection: true,
            modeBlock: true
          },
          frameOptions: {
            override: true,
            frameOption: cloudfront.HeadersFrameOption.DENY
          }
        }
      });

      const cloudfrontDistribution = new cloudfront.Distribution(this, 'CloudFrontDistribution', {
        certificate: certificate,
        domainNames: [domainName],
        defaultRootObject: 'index.html',
        errorResponses: [
            {
              httpStatus: 403,
              responseHttpStatus: 403,
              responsePagePath: '/index.html',
            },
            {
              httpStatus: 404,
              responseHttpStatus: 404,
              responsePagePath: '/404.html',
            },
        ],
        defaultBehavior: {
          origin: new origins.S3Origin(assetsBucket, {
            originAccessIdentity: cloudfrontOriginAccessIdentity,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          responseHeadersPolicy: responseHeaderPolicy
        },
        additionalBehaviors: {
          '/posts/*': { origin: new origins.RestApiOrigin(api) }
        }
      });
      
      new route53.NsRecord(this, 'NSRecord', {
        zone,
        values: zone.hostedZoneNameServers ? zone.hostedZoneNameServers : []
      });
  
  }
}

