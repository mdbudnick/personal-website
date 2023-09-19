import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface MyWebsiteAppStackProps extends cdk.StackProps {
  stage: string;
  domainName: string;
  staticBucketName: string;
}

export class MyWebsiteAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MyWebsiteAppStackProps) {
    super(scope, id, props);

    if (!props || !props.domainName || props.domainName == '') {
      throw new Error('The domainName property is not defined.');
    }
    const domainName = props.domainName;

    if (!props || !props.staticBucketName || props.staticBucketName == '') {
      throw new Error('The staticBucketName property is not defined.');
    }
    const bucketName = props.staticBucketName;

    
    const blogTable = this.createDynamoDbTable();

    const readBlogFunction = new lambda.Function(this, 'ReadBlogFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'read.handler',
      code: lambda.Code.fromAsset('lambda')
    });

    const createBlogFunction = new lambda.Function(this, 'CreateBlogFunction', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'create.handler',
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

    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'CloudFrontOriginAccessIdentity');
    
    // We need to add this policy explicitly: https://stackoverflow.com/a/60917015/5637762
    const policyStatement = new iam.PolicyStatement();
    policyStatement.addActions('s3:GetBucket*');
    policyStatement.addActions('s3:GetObject*');
    policyStatement.addActions('s3:List*');
    policyStatement.addResources(assetsBucket.bucketArn);
    policyStatement.addResources(`${assetsBucket.bucketArn}/*`);
    policyStatement.addCanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId);
    if( !assetsBucket.policy ) {
      new s3.BucketPolicy(this, 'Policy', { bucket: assetsBucket }).document.addStatements(policyStatement);
    } else {
      assetsBucket.policy.document.addStatements(policyStatement);
    }

    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName });

    const certificate = new acm.Certificate(this, 'SiteCertificate',
      {
        domainName,
        subjectAlternativeNames: [`www.${domainName}`],
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
        certificate,
        domainNames: [domainName, `www.${domainName}`],
        sslSupportMethod: cloudfront.SSLMethod.SNI,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
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
          '/posts': { origin: new origins.RestApiOrigin(api) },
          '/posts/*': { origin: new origins.RestApiOrigin(api) }
        },
        enableLogging: true,
        logIncludesCookies: true,
        logFilePrefix: 'cloudfront-logs/',
      });

      // Create a new CNAME record for "www." + domainName pointing to CloudFront
      new route53.CnameRecord(this, 'CnameRecord', {
        zone,
        recordName: `www.${domainName}`,
        domainName: cloudfrontDistribution.domainName,
        ttl: cdk.Duration.minutes(5),
        deleteExisting: true
      });
  }
 
  createDynamoDbTable() {
    let existingTable = dynamodb.Table.fromTableName(this, 'ExistingBlogPostsTable', 'BlogPosts');
    
    return existingTable ? existingTable : new dynamodb.Table(this, 'BlogPosts', {
      tableName: 'BlogPosts',
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created', type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });
  }
  
}

