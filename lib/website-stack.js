"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyWebsiteAppStack = void 0;
const acm = require("aws-cdk-lib/aws-certificatemanager");
const cdk = require("aws-cdk-lib");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const route53 = require("aws-cdk-lib/aws-route53");
const s3 = require("aws-cdk-lib/aws-s3");
const targets = require("aws-cdk-lib/aws-route53-targets");
class MyWebsiteAppStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            removalPolicy: props.environment != "production"
                ? cdk.RemovalPolicy.DESTROY
                : cdk.RemovalPolicy.RETAIN,
            autoDeleteObjects: props.environment != "production",
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
        });
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, "OriginAccessIdentity");
        bucket.grantRead(originAccessIdentity);
        // We need to create this Zone beforehand because the domain name is not managed by AWS
        const zone = props.environment == "test"
            ? new route53.HostedZone(this, "TestZone", { zoneName: "testing" })
            : route53.HostedZone.fromLookup(this, "HostedZone", {
                domainName,
            });
        const certificate = props.environment !== "staging"
            ? new acm.Certificate(this, "SiteCertificate", {
                domainName,
                subjectAlternativeNames: [`*.${domainName}`],
                validation: {
                    method: acm.ValidationMethod.DNS,
                    props: { hostedZone: zone },
                },
            }) : undefined;
        const responseHeaderPolicy = this.createCFResponseHeadersPolicy();
        const distribution = this.createDistribution(domainName, bucket, originAccessIdentity, responseHeaderPolicy, certificate);
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
            target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
            ttl: cdk.Duration.minutes(5),
            deleteExisting: true,
        });
        new cdk.CfnOutput(this, "Domain", { value: `https://www.${domainName}` });
        new cdk.CfnOutput(this, "Bucket name", { value: bucketName });
        new cdk.CfnOutput(this, "CloudFrontUrl", {
            value: distribution.distributionDomainName,
        });
    }
    createCFResponseHeadersPolicy() {
        return new cloudfront.ResponseHeadersPolicy(this, "SecurityHeadersResponseHeaderPolicy", {
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
                    referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
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
        });
    }
    createDistribution(domainName, bucket, originAccessIdentity, headersPolicy, certificate) {
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
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
                responseHeadersPolicy: headersPolicy,
            },
            enableLogging: true,
            logIncludesCookies: true,
            logFilePrefix: "cloudfront-logs/",
        });
    }
}
exports.MyWebsiteAppStack = MyWebsiteAppStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic2l0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndlYnNpdGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMERBQTBEO0FBQzFELG1DQUFtQztBQUNuQyx5REFBeUQ7QUFFekQsbURBQW1EO0FBQ25ELHlDQUF5QztBQUN6QywyREFBMkQ7QUFRM0QsTUFBYSxpQkFBa0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQThCO1FBQ3RFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxFQUFFLENBQUM7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxFQUFFLENBQUM7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBRXBDLE1BQU0sTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ2xELFVBQVU7WUFDVixhQUFhLEVBQ1gsS0FBSyxDQUFDLFdBQVcsSUFBSSxZQUFZO2dCQUMvQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1lBQzlCLGlCQUFpQixFQUFFLEtBQUss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a0IsRUFBRSxHQUFHO29CQUN2QixnQkFBZ0IsRUFBRSxhQUFhO2lCQUNoQztnQkFDRDtvQkFDRSxVQUFVLEVBQUUsR0FBRztvQkFDZixrQkFBa0IsRUFBRSxHQUFHO29CQUN2QixnQkFBZ0IsRUFBRSxXQUFXO2lCQUM5QjthQUNGO1lBQ0QsaUJBQWlCLEVBQUUsWUFBWTtZQUMvQixlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLElBQUksR0FBRyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3RELG9CQUFvQjtpQkFDckIsQ0FBQztnQkFDRixvQkFBb0IsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCO2dCQUN2RSxtQkFBbUIsRUFDakIsVUFBVSxDQUFDLG1CQUFtQixDQUFDLDZCQUE2QjtnQkFDOUQscUJBQXFCLEVBQUUsYUFBYTthQUNyQztZQUNELGFBQWEsRUFBRSxJQUFJO1lBQ25CLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsYUFBYSxFQUFFLGtCQUFrQjtTQUNsQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE5SkQsOENBOEpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYWNtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udFwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1yb3V0ZTUzXCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My10YXJnZXRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTXlXZWJzaXRlQXBwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZG9tYWluTmFtZTogc3RyaW5nO1xuICBidWNrZXROYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBNeVdlYnNpdGVBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogTXlXZWJzaXRlQXBwU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgaWYgKCFwcm9wcyB8fCAhcHJvcHMuZG9tYWluTmFtZSB8fCBwcm9wcy5kb21haW5OYW1lID09IFwiXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBkb21haW5OYW1lIHByb3BlcnR5IGlzIG5vdCBkZWZpbmVkLlwiKTtcbiAgICB9XG4gICAgY29uc3QgZG9tYWluTmFtZSA9IHByb3BzLmRvbWFpbk5hbWU7XG4gICAgaWYgKCFwcm9wcyB8fCAhcHJvcHMuYnVja2V0TmFtZSB8fCBwcm9wcy5idWNrZXROYW1lID09IFwiXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBidWNrZXROYW1lIHByb3BlcnR5IGlzIG5vdCBkZWZpbmVkLlwiKTtcbiAgICB9XG4gICAgY29uc3QgYnVja2V0TmFtZSA9IHByb3BzLmJ1Y2tldE5hbWU7XG5cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiV2Vic2l0ZUJ1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lLFxuICAgICAgcmVtb3ZhbFBvbGljeTpcbiAgICAgICAgcHJvcHMuZW52aXJvbm1lbnQgIT0gXCJwcm9kdWN0aW9uXCJcbiAgICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcbiAgICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBwcm9wcy5lbnZpcm9ubWVudCAhPSBcInByb2R1Y3Rpb25cIixcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgIH0pO1xuICAgIGNvbnN0IG9yaWdpbkFjY2Vzc0lkZW50aXR5ID0gbmV3IGNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzSWRlbnRpdHkoXG4gICAgICB0aGlzLFxuICAgICAgXCJPcmlnaW5BY2Nlc3NJZGVudGl0eVwiXG4gICAgKTtcbiAgICBidWNrZXQuZ3JhbnRSZWFkKG9yaWdpbkFjY2Vzc0lkZW50aXR5KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY3JlYXRlIHRoaXMgWm9uZSBiZWZvcmVoYW5kIGJlY2F1c2UgdGhlIGRvbWFpbiBuYW1lIGlzIG5vdCBtYW5hZ2VkIGJ5IEFXU1xuICAgIGNvbnN0IHpvbmUgPVxuICAgICAgcHJvcHMuZW52aXJvbm1lbnQgPT0gXCJ0ZXN0XCJcbiAgICAgICAgPyBuZXcgcm91dGU1My5Ib3N0ZWRab25lKHRoaXMsIFwiVGVzdFpvbmVcIiwgeyB6b25lTmFtZTogXCJ0ZXN0aW5nXCIgfSlcbiAgICAgICAgOiByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCBcIkhvc3RlZFpvbmVcIiwge1xuICAgICAgICAgICAgZG9tYWluTmFtZSxcbiAgICAgICAgICB9KTtcblxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gcHJvcHMuZW52aXJvbm1lbnQgIT09IFwic3RhZ2luZ1wiXG4gICAgPyBuZXcgYWNtLkNlcnRpZmljYXRlKHRoaXMsIFwiU2l0ZUNlcnRpZmljYXRlXCIsIHtcbiAgICAgIGRvbWFpbk5hbWUsXG4gICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogW2AqLiR7ZG9tYWluTmFtZX1gXSxcbiAgICAgIHZhbGlkYXRpb246IHtcbiAgICAgICAgbWV0aG9kOiBhY20uVmFsaWRhdGlvbk1ldGhvZC5ETlMsXG4gICAgICAgIHByb3BzOiB7IGhvc3RlZFpvbmU6IHpvbmUgfSxcbiAgICAgIH0sXG4gICAgfSkgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCByZXNwb25zZUhlYWRlclBvbGljeSA9IHRoaXMuY3JlYXRlQ0ZSZXNwb25zZUhlYWRlcnNQb2xpY3koKTtcblxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvbiA9IHRoaXMuY3JlYXRlRGlzdHJpYnV0aW9uKFxuICAgICAgZG9tYWluTmFtZSxcbiAgICAgIGJ1Y2tldCBhcyBzMy5CdWNrZXQsXG4gICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICAgIHJlc3BvbnNlSGVhZGVyUG9saWN5LFxuICAgICAgY2VydGlmaWNhdGVcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IENOQU1FIHJlY29yZCBmb3IgXCJ3d3cuXCIgKyBkb21haW5OYW1lIHBvaW50aW5nIHRvIHRoZSBuZXcgZGlzdHJpYnV0aW9uXG4gICAgbmV3IHJvdXRlNTMuQ25hbWVSZWNvcmQodGhpcywgXCJDbmFtZVJlY29yZFwiLCB7XG4gICAgICB6b25lLFxuICAgICAgcmVjb3JkTmFtZTogYHd3dy4ke2RvbWFpbk5hbWV9YCxcbiAgICAgIGRvbWFpbk5hbWU6IGRpc3RyaWJ1dGlvbi5kb21haW5OYW1lLFxuICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIGRlbGV0ZUV4aXN0aW5nOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCBcIkFsaWFzIEFSZWNvcmRcIiwge1xuICAgICAgem9uZSxcbiAgICAgIHJlY29yZE5hbWU6IGRvbWFpbk5hbWUsXG4gICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhcbiAgICAgICAgbmV3IHRhcmdldHMuQ2xvdWRGcm9udFRhcmdldChkaXN0cmlidXRpb24pXG4gICAgICApLFxuICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIGRlbGV0ZUV4aXN0aW5nOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJEb21haW5cIiwgeyB2YWx1ZTogYGh0dHBzOi8vd3d3LiR7ZG9tYWluTmFtZX1gIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQnVja2V0IG5hbWVcIiwgeyB2YWx1ZTogYnVja2V0TmFtZSB9KTtcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkNsb3VkRnJvbnRVcmxcIiwge1xuICAgICAgdmFsdWU6IGRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlQ0ZSZXNwb25zZUhlYWRlcnNQb2xpY3koKTogY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3kge1xuICAgIHJldHVybiBuZXcgY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3koXG4gICAgICB0aGlzLFxuICAgICAgXCJTZWN1cml0eUhlYWRlcnNSZXNwb25zZUhlYWRlclBvbGljeVwiLFxuICAgICAge1xuICAgICAgICBjb21tZW50OiBcIlNlY3VyaXR5IGhlYWRlcnMgcmVzcG9uc2UgaGVhZGVyIHBvbGljeVwiLFxuICAgICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIGFjY2Vzc0NvbnRyb2xNYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDIgKiAzNjUpLFxuICAgICAgICAgICAgaW5jbHVkZVN1YmRvbWFpbnM6IHRydWUsXG4gICAgICAgICAgICBwcmVsb2FkOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY29udGVudFR5cGVPcHRpb25zOiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIHJlZmVycmVyUG9saWN5OlxuICAgICAgICAgICAgICBjbG91ZGZyb250LkhlYWRlcnNSZWZlcnJlclBvbGljeS5TVFJJQ1RfT1JJR0lOX1dIRU5fQ1JPU1NfT1JJR0lOLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgICAgICBwcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZnJhbWVPcHRpb25zOiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIGZyYW1lT3B0aW9uOiBjbG91ZGZyb250LkhlYWRlcnNGcmFtZU9wdGlvbi5ERU5ZLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGNyZWF0ZURpc3RyaWJ1dGlvbihcbiAgICBkb21haW5OYW1lOiBzdHJpbmcsXG4gICAgYnVja2V0OiBzMy5CdWNrZXQsXG4gICAgb3JpZ2luQWNjZXNzSWRlbnRpdHk6IGNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzSWRlbnRpdHksXG4gICAgaGVhZGVyc1BvbGljeTogY2xvdWRmcm9udC5SZXNwb25zZUhlYWRlcnNQb2xpY3ksXG4gICAgY2VydGlmaWNhdGU6IGFjbS5DZXJ0aWZpY2F0ZSB8IHVuZGVmaW5lZCxcbiAgKTogY2xvdWRmcm9udC5EaXN0cmlidXRpb24ge1xuICAgIHJldHVybiBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgXCJDbG91ZEZyb250RGlzdHJpYnV0aW9uXCIsIHtcbiAgICAgIGNlcnRpZmljYXRlLFxuICAgICAgZG9tYWluTmFtZXM6IFtkb21haW5OYW1lLCBgd3d3LiR7ZG9tYWluTmFtZX1gXSxcbiAgICAgIHNzbFN1cHBvcnRNZXRob2Q6IGNsb3VkZnJvbnQuU1NMTWV0aG9kLlNOSSxcbiAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDE4LFxuICAgICAgZXJyb3JSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiBcIi9pbmRleC5odG1sXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBodHRwU3RhdHVzOiA0MDQsXG4gICAgICAgICAgcmVzcG9uc2VIdHRwU3RhdHVzOiA0MDQsXG4gICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvNDA0Lmh0bWxcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBkZWZhdWx0Um9vdE9iamVjdDogXCJpbmRleC5odG1sXCIsXG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBuZXcgY2RrLmF3c19jbG91ZGZyb250X29yaWdpbnMuUzNPcmlnaW4oYnVja2V0LCB7XG4gICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHksXG4gICAgICAgIH0pLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTpcbiAgICAgICAgICBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUl9FWENFUFRfSE9TVF9IRUFERVIsXG4gICAgICAgIHJlc3BvbnNlSGVhZGVyc1BvbGljeTogaGVhZGVyc1BvbGljeSxcbiAgICAgIH0sXG4gICAgICBlbmFibGVMb2dnaW5nOiB0cnVlLFxuICAgICAgbG9nSW5jbHVkZXNDb29raWVzOiB0cnVlLFxuICAgICAgbG9nRmlsZVByZWZpeDogXCJjbG91ZGZyb250LWxvZ3MvXCIsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==