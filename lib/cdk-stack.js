"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MyWebsiteAppStack = void 0
const acm = require("aws-cdk-lib/aws-certificatemanager")
const apigateway = require("aws-cdk-lib/aws-apigateway")
const cdk = require("aws-cdk-lib")
const cloudfront = require("aws-cdk-lib/aws-cloudfront")
const dynamodb = require("aws-cdk-lib/aws-dynamodb")
const iam = require("aws-cdk-lib/aws-iam")
const lambda = require("aws-cdk-lib/aws-lambda")
const origins = require("aws-cdk-lib/aws-cloudfront-origins")
const route53 = require("aws-cdk-lib/aws-route53")
const s3 = require("aws-cdk-lib/aws-s3")
class MyWebsiteAppStack extends cdk.Stack {
  constructor (scope, id, props) {
    super(scope, id, props)
    if (!props || !props.domainName || props.domainName === "") {
      throw new Error("The domainName property is not defined.")
    }
    const domainName = props.domainName
    if (!props || !props.bucketName || props.bucketName === "") {
      throw new Error("The bucketName property is not defined.")
    }
    const bucketName = props.bucketName
    if (!props || !props.environment || props.environment === "") {
      throw new Error("The environment property is not defined.")
    }
    const environment = props.environment
    const blogTable = this.createDynamoDbTable()
    const readBlogFunction = new lambda.Function(this, "ReadBlogFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "read.handler",
      code: lambda.Code.fromAsset("lambda/read"),
      currentVersionOptions: {
        codeSha256: props.readHandlerVersion
      }
    })
    readBlogFunction.currentVersion
    const createBlogFunction = new lambda.Function(this, "CreateBlogFunction", {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "create.handler",
      code: lambda.Code.fromAsset("lambda/create"),
      currentVersionOptions: {
        codeSha256: props.createHandlerVersion
      }
    })
    createBlogFunction.currentVersion
    blogTable.grantReadData(readBlogFunction)
    blogTable.grantReadWriteData(createBlogFunction)
    const api = new apigateway.RestApi(this, "BlogApi")
    const readBlogIntegration = new apigateway.LambdaIntegration(readBlogFunction)
    const createBlogIntegration = new apigateway.LambdaIntegration(createBlogFunction)
    api.root.addMethod("GET", readBlogIntegration)
    api.root.addMethod("POST", createBlogIntegration)
    const assetsBucket = s3.Bucket.fromBucketName(this, "WebsiteBucket", bucketName)
    const cloudfrontOriginAccessIdentity = new cloudfront.OriginAccessIdentity(this, "CloudFrontOriginAccessIdentity")
    // We need to add this policy explicitly: https://stackoverflow.com/a/60917015/5637762
    const policyStatement = new iam.PolicyStatement()
    policyStatement.addActions("s3:GetBucket*")
    policyStatement.addActions("s3:GetObject*")
    policyStatement.addActions("s3:List*")
    policyStatement.addResources(assetsBucket.bucketArn)
    policyStatement.addResources(`${assetsBucket.bucketArn}/*`)
    policyStatement.addCanonicalUserPrincipal(cloudfrontOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)
    if (!assetsBucket.policy) {
      new s3.BucketPolicy(this, "Policy", { bucket: assetsBucket }).document.addStatements(policyStatement)
    } else {
      assetsBucket.policy.document.addStatements(policyStatement)
    }
    const zone = route53.HostedZone.fromLookup(this, "HostedZone", { domainName })
    const certificate = environment === "production" ? new acm.Certificate(this, "SiteCertificate", {
      domainName,
      subjectAlternativeNames: [`www.${domainName}`],
      validation: { method: acm.ValidationMethod.DNS, props: { hostedZone: zone } }
    }) : null
    const responseHeaderPolicy = new cloudfront.ResponseHeadersPolicy(this, "SecurityHeadersResponseHeaderPolicy", {
      comment: "Security headers response header policy",
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
    })
    const cloudfrontDistribution = new cloudfront.Distribution(this, "CloudFrontDistribution", {
      certificate,
      domainNames: [domainName, `www.${domainName}`],
      sslSupportMethod: cloudfront.SSLMethod.SNI,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: "/index.html"
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html"
        }
      ],
      defaultBehavior: {
        origin: new origins.S3Origin(assetsBucket, {
          originAccessIdentity: cloudfrontOriginAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: responseHeaderPolicy
      },
      additionalBehaviors: {
        "/posts": { origin: new origins.RestApiOrigin(api) },
        "/posts/*": { origin: new origins.RestApiOrigin(api) }
      },
      enableLogging: true,
      logIncludesCookies: true,
      logFilePrefix: "cloudfront-logs/"
    })
    // Create a new CNAME record for "www." + domainName pointing to CloudFront
    new route53.CnameRecord(this, "CnameRecord", {
      zone,
      recordName: `www.${domainName}`,
      domainName: cloudfrontDistribution.domainName,
      ttl: cdk.Duration.minutes(5),
      deleteExisting: true
    })
  }

  createDynamoDbTable () {
    const existingTable = dynamodb.Table.fromTableName(this, "ExistingBlogPostsTable", "BlogPosts")
    return existingTable || new dynamodb.Table(this, "BlogPosts", {
      tableName: "BlogPosts",
      partitionKey: { name: "postId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "created", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
  }
}
exports.MyWebsiteAppStack = MyWebsiteAppStack
// # sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2RrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDBEQUEwRDtBQUMxRCx5REFBeUQ7QUFDekQsbUNBQW1DO0FBQ25DLHlEQUF5RDtBQUV6RCxxREFBcUQ7QUFDckQsMkNBQTJDO0FBQzNDLGlEQUFpRDtBQUNqRCw4REFBOEQ7QUFDOUQsbURBQW1EO0FBQ25ELHlDQUF5QztBQVV6QyxNQUFhLGlCQUFrQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBOEI7UUFDdEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSxFQUFFLEVBQUU7WUFDekQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1NBQzVEO1FBQ0QsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUVwQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLEVBQUU7WUFDckUsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ2xFO1FBQ0QsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1FBRzFDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBRTdDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUNyRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxjQUFjO1lBQ3ZCLElBQUksRUFB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LFVBQVU7WUFDN0MsR0FBRyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUM1QixjQUFjLEVBQUUsSUFBSTtTQUNyQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsbUJBQW1CO1FBQ2pCLElBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUU5RixPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUMzRSxTQUFTLEVBQUUsV0FBVztZQUN0QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FFRjtBQWxLRCw4Q0FrS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhY20gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQtb3JpZ2lucyc7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTXlXZWJzaXRlQXBwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgc3RhZ2U6IHN0cmluZztcbiAgZG9tYWluTmFtZTogc3RyaW5nO1xuICBzdGF0aWNCdWNrZXROYW1lOiBzdHJpbmc7XG4gIHJlYWRIYW5kbGVyVmVyc2lvbjogc3RyaW5nO1xuICBjcmVhdGVIYW5kbGVyVmVyc2lvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTXlXZWJzaXRlQXBwU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IE15V2Vic2l0ZUFwcFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGlmICghcHJvcHMgfHwgIXByb3BzLmRvbWFpbk5hbWUgfHwgcHJvcHMuZG9tYWluTmFtZSA9PSAnJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZG9tYWluTmFtZSBwcm9wZXJ0eSBpcyBub3QgZGVmaW5lZC4nKTtcbiAgICB9XG4gICAgY29uc3QgZG9tYWluTmFtZSA9IHByb3BzLmRvbWFpbk5hbWU7XG5cbiAgICBpZiAoIXByb3BzIHx8ICFwcm9wcy5zdGF0aWNCdWNrZXROYW1lIHx8IHByb3BzLnN0YXRpY0J1Y2tldE5hbWUgPT0gJycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHN0YXRpY0J1Y2tldE5hbWUgcHJvcGVydHkgaXMgbm90IGRlZmluZWQuJyk7XG4gICAgfVxuICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSBwcm9wcy5zdGF0aWNCdWNrZXROYW1lO1xuXG4gICAgXG4gICAgY29uc3QgYmxvZ1RhYmxlID0gdGhpcy5jcmVhdGVEeW5hbW9EYlRhYmxlKCk7XG5cbiAgICBjb25zdCByZWFkQmxvZ0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnUmVhZEJsb2dGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgaGFuZGxlcjogJ3JlYWQuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYS9yZWFkJyksXG4gICAgICBjdXJyZW50VmVyc2lvbk9wdGlvbnM6IHtcbiAgICAgICAgY29kZVNoYTI1NjogcHJvcHMucmVhZEhhbmRsZXJWZXJzaW9uXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVhZEJsb2dGdW5jdGlvbi5jdXJyZW50VmVyc2lvbjtcblxuICAgIGNvbnN0IGNyZWF0ZUJsb2dGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NyZWF0ZUJsb2dGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgaGFuZGxlcjogJ2NyZWF0ZS5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhL2NyZWF0ZScpLFxuICAgICAgY3VycmVudFZlcnNpb25PcHRpb25zOiB7XG4gICAgICAgIGNvZGVTaGEyNTY6IHByb3BzLmNyZWF0ZUhhbmRsZXJWZXJzaW9uXG4gICAgICB9XG4gICAgfSk7XG4gICAgY3JlYXRlQmxvZ0Z1bmN0aW9uLmN1cnJlbnRWZXJzaW9uO1xuXG4gICAgYmxvZ1RhYmxlLmdyYW50UmVhZERhdGEocmVhZEJsb2dGdW5jdGlvbik7XG4gICAgYmxvZ1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVCbG9nRnVuY3Rpb24pO1xuXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnQmxvZ0FwaScpO1xuXG4gICAgY29uc3QgcmVhZEJsb2dJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHJlYWRCbG9nRnVuY3Rpb24pO1xuICAgIGNvbnN0IGNyZWF0ZUJsb2dJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGNyZWF0ZUJsb2dGdW5jdGlvbik7XG5cbiAgICBhcGkucm9vdC5hZGRNZXRob2QoJ0dFVCcsIHJlYWRCbG9nSW50ZWdyYXRpb24pO1xuICAgIGFwaS5yb290LmFkZE1ldGhvZCgnUE9TVCcsIGNyZWF0ZUJsb2dJbnRlZ3JhdGlvbik7XG5cbiAgICBjb25zdCBhc3NldHNCdWNrZXQgPSBzMy5CdWNrZXQuZnJvbUJ1Y2tldE5hbWUodGhpcywgJ1dlYnNpdGVCdWNrZXQnLCBidWNrZXROYW1lKTtcblxuICAgIGNvbnN0IGNsb3VkZnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eSA9IG5ldyBjbG91ZGZyb250Lk9yaWdpbkFjY2Vzc0lkZW50aXR5KHRoaXMsICdDbG91ZEZyb250T3JpZ2luQWNjZXNzSWRlbnRpdHknKTtcbiAgICBcbiAgICAvLyBXZSBuZWVkIHRvIGFkZCB0aGlzIHBvbGljeSBleHBsaWNpdGx5OiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNjA5MTcwMTUvNTYzNzc2MlxuICAgIGNvbnN0IHBvbGljeVN0YXRlbWVudCA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KCk7XG4gICAgcG9saWN5U3RhdGVtZW50LmFkZEFjdGlvbnMoJ3MzOkdldEJ1Y2tldConKTtcbiAgICBwb2xpY3lTdGF0ZW1lbnQuYWRkQWN0aW9ucygnczM6R2V0T2JqZWN0KicpO1xuICAgIHBvbGljeVN0YXRlbWVudC5hZGRBY3Rpb25zKCdzMzpMaXN0KicpO1xuICAgIHBvbGljeVN0YXRlbWVudC5hZGRSZXNvdXJjZXMoYXNzZXRzQnVja2V0LmJ1Y2tldEFybik7XG4gICAgcG9saWN5U3RhdGVtZW50LmFkZFJlc291cmNlcyhgJHthc3NldHNCdWNrZXQuYnVja2V0QXJufS8qYCk7XG4gICAgcG9saWN5U3RhdGVtZW50LmFkZENhbm9uaWNhbFVzZXJQcmluY2lwYWwoY2xvdWRmcm9udE9yaWdpbkFjY2Vzc0lkZW50aXR5LmNsb3VkRnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eVMzQ2Fub25pY2FsVXNlcklkKTtcbiAgICBpZiggIWFzc2V0c0J1Y2tldC5wb2xpY3kgKSB7XG4gICAgICBuZXcgczMuQnVja2V0UG9saWN5KHRoaXMsICdQb2xpY3knLCB7IGJ1Y2tldDogYXNzZXRzQnVja2V0IH0pLmRvY3VtZW50LmFkZFN0YXRlbWVudHMocG9saWN5U3RhdGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXRzQnVja2V0LnBvbGljeS5kb2N1bWVudC5hZGRTdGF0ZW1lbnRzKHBvbGljeVN0YXRlbWVudCk7XG4gICAgfVxuXG4gICAgY29uc3Qgem9uZSA9IHJvdXRlNTMuSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsICdIb3N0ZWRab25lJywgeyBkb21haW5OYW1lIH0pO1xuXG4gICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgYWNtLkNlcnRpZmljYXRlKHRoaXMsICdTaXRlQ2VydGlmaWNhdGUnLFxuICAgICAge1xuICAgICAgICBkb21haW5OYW1lLFxuICAgICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogW2B3d3cuJHtkb21haW5OYW1lfWBdLFxuICAgICAgICB2YWxpZGF0aW9uOiB7IG1ldGhvZDogYWNtLlZhbGlkYXRpb25NZXRob2QuRE5TLCBwcm9wczogeyBob3N0ZWRab25lOiB6b25lIH0gfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlSGVhZGVyUG9saWN5ID0gbmV3IGNsb3VkZnJvbnQuUmVzcG9uc2VIZWFkZXJzUG9saWN5KHRoaXMsICdTZWN1cml0eUhlYWRlcnNSZXNwb25zZUhlYWRlclBvbGljeScsIHtcbiAgICAgICAgY29tbWVudDogJ1NlY3VyaXR5IGhlYWRlcnMgcmVzcG9uc2UgaGVhZGVyIHBvbGljeScsXG4gICAgICAgIHNlY3VyaXR5SGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgICAgY29udGVudFNlY3VyaXR5UG9saWN5OiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbnRlbnRTZWN1cml0eVBvbGljeTogXCJkZWZhdWx0LXNyYyAnc2VsZidcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMiAqIDM2NSksXG4gICAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcbiAgICAgICAgICAgIHByZWxvYWQ6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbnRlbnRUeXBlT3B0aW9uczoge1xuICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OiBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeS5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOXG4gICAgICAgICAgfSxcbiAgICAgICAgICB4c3NQcm90ZWN0aW9uOiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIHByb3RlY3Rpb246IHRydWUsXG4gICAgICAgICAgICBtb2RlQmxvY2s6IHRydWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZyYW1lT3B0aW9uczoge1xuICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICBmcmFtZU9wdGlvbjogY2xvdWRmcm9udC5IZWFkZXJzRnJhbWVPcHRpb24uREVOWVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNsb3VkZnJvbnREaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ0Nsb3VkRnJvbnREaXN0cmlidXRpb24nLCB7XG4gICAgICAgIGNlcnRpZmljYXRlLFxuICAgICAgICBkb21haW5OYW1lczogW2RvbWFpbk5hbWUsIGB3d3cuJHtkb21haW5OYW1lfWBdLFxuICAgICAgICBzc2xTdXBwb3J0TWV0aG9kOiBjbG91ZGZyb250LlNTTE1ldGhvZC5TTkksXG4gICAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDE4LFxuICAgICAgICBkZWZhdWx0Um9vdE9iamVjdDogJ2luZGV4Lmh0bWwnLFxuICAgICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogJy80MDQuaHRtbCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLlMzT3JpZ2luKGFzc2V0c0J1Y2tldCwge1xuICAgICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IGNsb3VkZnJvbnRPcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3k6IHJlc3BvbnNlSGVhZGVyUG9saWN5XG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxCZWhhdmlvcnM6IHtcbiAgICAgICAgICAnL3Bvc3RzJzogeyBvcmlnaW46IG5ldyBvcmlnaW5zLlJlc3RBcGlPcmlnaW4oYXBpKSB9LFxuICAgICAgICAgICcvcG9zdHMvKic6IHsgb3JpZ2luOiBuZXcgb3JpZ2lucy5SZXN0QXBpT3JpZ2luKGFwaSkgfVxuICAgICAgICB9LFxuICAgICAgICBlbmFibGVMb2dnaW5nOiB0cnVlLFxuICAgICAgICBsb2dJbmNsdWRlc0Nvb2tpZXM6IHRydWUsXG4gICAgICAgIGxvZ0ZpbGVQcmVmaXg6ICdjbG91ZGZyb250LWxvZ3MvJyxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgQ05BTUUgcmVjb3JkIGZvciBcInd3dy5cIiArIGRvbWFpbk5hbWUgcG9pbnRpbmcgdG8gQ2xvdWRGcm9udFxuICAgICAgbmV3IHJvdXRlNTMuQ25hbWVSZWNvcmQodGhpcywgJ0NuYW1lUmVjb3JkJywge1xuICAgICAgICB6b25lLFxuICAgICAgICByZWNvcmROYW1lOiBgd3d3LiR7ZG9tYWluTmFtZX1gLFxuICAgICAgICBkb21haW5OYW1lOiBjbG91ZGZyb250RGlzdHJpYnV0aW9uLmRvbWFpbk5hbWUsXG4gICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIGRlbGV0ZUV4aXN0aW5nOiB0cnVlXG4gICAgICB9KTtcbiAgfVxuIFxuICBjcmVhdGVEeW5hbW9EYlRhYmxlKCkge1xuICAgIGxldCBleGlzdGluZ1RhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZSh0aGlzLCAnRXhpc3RpbmdCbG9nUG9zdHNUYWJsZScsICdCbG9nUG9zdHMnKTtcbiAgICBcbiAgICByZXR1cm4gZXhpc3RpbmdUYWJsZSA/IGV4aXN0aW5nVGFibGUgOiBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0Jsb2dQb3N0cycsIHtcbiAgICAgIHRhYmxlTmFtZTogJ0Jsb2dQb3N0cycsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bvc3RJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIgfSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgIH0pO1xuICB9XG4gIFxufVxuXG4iXX0=
