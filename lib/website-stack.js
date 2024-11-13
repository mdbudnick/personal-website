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
        const certificate = props.environment == "production"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic2l0ZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndlYnNpdGUtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMERBQTBEO0FBQzFELG1DQUFtQztBQUNuQyx5REFBeUQ7QUFFekQsbURBQW1EO0FBQ25ELHlDQUF5QztBQUN6QywyREFBMkQ7QUFRM0QsTUFBYSxpQkFBa0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUM5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQThCO1FBQ3RFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxFQUFFLENBQUM7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksRUFBRSxFQUFFLENBQUM7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFDRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBRXBDLE1BQU0sTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ2xELFVBQVU7WUFDVixhQUFhLEVBQ1gsS0FBSyxDQUFDLFdBQVcsSUFBSSxZQUFZO2dCQUMvQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO2dCQUMzQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1lBQzlCLGlCQUFpQixFQUFFLEtBQUss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a0IsRUFBRSxHQUFHO29CQUN2QixnQkFBZ0IsRUFBRSxhQUFhO2lCQUNoQztnQkFDRDtvQkFDRSxVQUFVLEVBQUUsR0FBRztvQkFDZixrQkFBa0IsRUFBRSxHQUFHO29CQUN2QixnQkFBZ0IsRUFBRSxXQUFXO2lCQUM5QjthQUNGO1lBQ0QsaUJBQWlCLEVBQUUsWUFBWTtZQUMvQixlQUFlLEVBQUU7Z0JBQ2YsTUFBTSxFQUFFLElBQUksR0FBRyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUU7b0JBQ3RELG9CQUFvQjtpQkFDckIsQ0FBQztnQkFDRixvQkFBb0IsRUFBRSxVQUFVLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCO2dCQUN2RSxtQkFBbUIsRUFDakIsVUFBVSxDQUFDLG1CQUFtQixDQUFDLDZCQUE2QjtnQkFDOUQscUJBQXFCLEVBQUUsYUFBYTthQUNyQztZQUNELGFBQWEsRUFBRSxJQUFJO1lBQ25CLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsYUFBYSxFQUFFLGtCQUFrQjtTQUNsQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE5SkQsOENBOEpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYWNtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgKiBhcyBjbG91ZGZyb250IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udFwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1yb3V0ZTUzXCI7XG5pbXBvcnQgKiBhcyBzMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtcm91dGU1My10YXJnZXRzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTXlXZWJzaXRlQXBwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZG9tYWluTmFtZTogc3RyaW5nO1xuICBidWNrZXROYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBNeVdlYnNpdGVBcHBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogTXlXZWJzaXRlQXBwU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgaWYgKCFwcm9wcyB8fCAhcHJvcHMuZG9tYWluTmFtZSB8fCBwcm9wcy5kb21haW5OYW1lID09IFwiXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBkb21haW5OYW1lIHByb3BlcnR5IGlzIG5vdCBkZWZpbmVkLlwiKTtcbiAgICB9XG4gICAgY29uc3QgZG9tYWluTmFtZSA9IHByb3BzLmRvbWFpbk5hbWU7XG4gICAgaWYgKCFwcm9wcyB8fCAhcHJvcHMuYnVja2V0TmFtZSB8fCBwcm9wcy5idWNrZXROYW1lID09IFwiXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBidWNrZXROYW1lIHByb3BlcnR5IGlzIG5vdCBkZWZpbmVkLlwiKTtcbiAgICB9XG4gICAgY29uc3QgYnVja2V0TmFtZSA9IHByb3BzLmJ1Y2tldE5hbWU7XG5cbiAgICBjb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiV2Vic2l0ZUJ1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lLFxuICAgICAgcmVtb3ZhbFBvbGljeTpcbiAgICAgICAgcHJvcHMuZW52aXJvbm1lbnQgIT0gXCJwcm9kdWN0aW9uXCJcbiAgICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1lcbiAgICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBwcm9wcy5lbnZpcm9ubWVudCAhPSBcInByb2R1Y3Rpb25cIixcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICBlbmZvcmNlU1NMOiB0cnVlLFxuICAgIH0pO1xuICAgIGNvbnN0IG9yaWdpbkFjY2Vzc0lkZW50aXR5ID0gbmV3IGNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzSWRlbnRpdHkoXG4gICAgICB0aGlzLFxuICAgICAgXCJPcmlnaW5BY2Nlc3NJZGVudGl0eVwiXG4gICAgKTtcbiAgICBidWNrZXQuZ3JhbnRSZWFkKG9yaWdpbkFjY2Vzc0lkZW50aXR5KTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY3JlYXRlIHRoaXMgWm9uZSBiZWZvcmVoYW5kIGJlY2F1c2UgdGhlIGRvbWFpbiBuYW1lIGlzIG5vdCBtYW5hZ2VkIGJ5IEFXU1xuICAgIGNvbnN0IHpvbmUgPVxuICAgICAgcHJvcHMuZW52aXJvbm1lbnQgPT0gXCJ0ZXN0XCJcbiAgICAgICAgPyBuZXcgcm91dGU1My5Ib3N0ZWRab25lKHRoaXMsIFwiVGVzdFpvbmVcIiwgeyB6b25lTmFtZTogXCJ0ZXN0aW5nXCIgfSlcbiAgICAgICAgOiByb3V0ZTUzLkhvc3RlZFpvbmUuZnJvbUxvb2t1cCh0aGlzLCBcIkhvc3RlZFpvbmVcIiwge1xuICAgICAgICAgICAgZG9tYWluTmFtZSxcbiAgICAgICAgICB9KTtcblxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gcHJvcHMuZW52aXJvbm1lbnQgPT0gXCJwcm9kdWN0aW9uXCJcbiAgICA/IG5ldyBhY20uQ2VydGlmaWNhdGUodGhpcywgXCJTaXRlQ2VydGlmaWNhdGVcIiwge1xuICAgICAgZG9tYWluTmFtZSxcbiAgICAgIHN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbYCouJHtkb21haW5OYW1lfWBdLFxuICAgICAgdmFsaWRhdGlvbjoge1xuICAgICAgICBtZXRob2Q6IGFjbS5WYWxpZGF0aW9uTWV0aG9kLkROUyxcbiAgICAgICAgcHJvcHM6IHsgaG9zdGVkWm9uZTogem9uZSB9LFxuICAgICAgfSxcbiAgICB9KSA6IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IHJlc3BvbnNlSGVhZGVyUG9saWN5ID0gdGhpcy5jcmVhdGVDRlJlc3BvbnNlSGVhZGVyc1BvbGljeSgpO1xuXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gdGhpcy5jcmVhdGVEaXN0cmlidXRpb24oXG4gICAgICBkb21haW5OYW1lLFxuICAgICAgYnVja2V0IGFzIHMzLkJ1Y2tldCxcbiAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5LFxuICAgICAgcmVzcG9uc2VIZWFkZXJQb2xpY3ksXG4gICAgICBjZXJ0aWZpY2F0ZVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgQ05BTUUgcmVjb3JkIGZvciBcInd3dy5cIiArIGRvbWFpbk5hbWUgcG9pbnRpbmcgdG8gdGhlIG5ldyBkaXN0cmlidXRpb25cbiAgICBuZXcgcm91dGU1My5DbmFtZVJlY29yZCh0aGlzLCBcIkNuYW1lUmVjb3JkXCIsIHtcbiAgICAgIHpvbmUsXG4gICAgICByZWNvcmROYW1lOiBgd3d3LiR7ZG9tYWluTmFtZX1gLFxuICAgICAgZG9tYWluTmFtZTogZGlzdHJpYnV0aW9uLmRvbWFpbk5hbWUsXG4gICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgZGVsZXRlRXhpc3Rpbmc6IHRydWUsXG4gICAgfSk7XG5cbiAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsIFwiQWxpYXMgQVJlY29yZFwiLCB7XG4gICAgICB6b25lLFxuICAgICAgcmVjb3JkTmFtZTogZG9tYWluTmFtZSxcbiAgICAgIHRhcmdldDogcm91dGU1My5SZWNvcmRUYXJnZXQuZnJvbUFsaWFzKFxuICAgICAgICBuZXcgdGFyZ2V0cy5DbG91ZEZyb250VGFyZ2V0KGRpc3RyaWJ1dGlvbilcbiAgICAgICksXG4gICAgICB0dGw6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgZGVsZXRlRXhpc3Rpbmc6IHRydWUsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkRvbWFpblwiLCB7IHZhbHVlOiBgaHR0cHM6Ly93d3cuJHtkb21haW5OYW1lfWAgfSk7XG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJCdWNrZXQgbmFtZVwiLCB7IHZhbHVlOiBidWNrZXROYW1lIH0pO1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQ2xvdWRGcm9udFVybFwiLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWUsXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVDRlJlc3BvbnNlSGVhZGVyc1BvbGljeSgpOiBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSB7XG4gICAgcmV0dXJuIG5ldyBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeShcbiAgICAgIHRoaXMsXG4gICAgICBcIlNlY3VyaXR5SGVhZGVyc1Jlc3BvbnNlSGVhZGVyUG9saWN5XCIsXG4gICAgICB7XG4gICAgICAgIGNvbW1lbnQ6IFwiU2VjdXJpdHkgaGVhZGVycyByZXNwb25zZSBoZWFkZXIgcG9saWN5XCIsXG4gICAgICAgIHNlY3VyaXR5SGVhZGVyc0JlaGF2aW9yOiB7XG4gICAgICAgICAgc3RyaWN0VHJhbnNwb3J0U2VjdXJpdHk6IHtcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMiAqIDM2NSksXG4gICAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcbiAgICAgICAgICAgIHByZWxvYWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb250ZW50VHlwZU9wdGlvbnM6IHtcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVmZXJyZXJQb2xpY3k6IHtcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k6XG4gICAgICAgICAgICAgIGNsb3VkZnJvbnQuSGVhZGVyc1JlZmVycmVyUG9saWN5LlNUUklDVF9PUklHSU5fV0hFTl9DUk9TU19PUklHSU4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB4c3NQcm90ZWN0aW9uOiB7XG4gICAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgICAgIHByb3RlY3Rpb246IHRydWUsXG4gICAgICAgICAgICBtb2RlQmxvY2s6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBmcmFtZU9wdGlvbnM6IHtcbiAgICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICAgICAgZnJhbWVPcHRpb246IGNsb3VkZnJvbnQuSGVhZGVyc0ZyYW1lT3B0aW9uLkRFTlksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgY3JlYXRlRGlzdHJpYnV0aW9uKFxuICAgIGRvbWFpbk5hbWU6IHN0cmluZyxcbiAgICBidWNrZXQ6IHMzLkJ1Y2tldCxcbiAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eTogY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICBoZWFkZXJzUG9saWN5OiBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSxcbiAgICBjZXJ0aWZpY2F0ZTogYWNtLkNlcnRpZmljYXRlIHwgdW5kZWZpbmVkLFxuICApOiBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbiB7XG4gICAgcmV0dXJuIG5ldyBjbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCBcIkNsb3VkRnJvbnREaXN0cmlidXRpb25cIiwge1xuICAgICAgY2VydGlmaWNhdGUsXG4gICAgICBkb21haW5OYW1lczogW2RvbWFpbk5hbWUsIGB3d3cuJHtkb21haW5OYW1lfWBdLFxuICAgICAgc3NsU3VwcG9ydE1ldGhvZDogY2xvdWRmcm9udC5TU0xNZXRob2QuU05JLFxuICAgICAgbWluaW11bVByb3RvY29sVmVyc2lvbjogY2xvdWRmcm9udC5TZWN1cml0eVBvbGljeVByb3RvY29sLlRMU19WMV8yXzIwMTgsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6IFwiL2luZGV4Lmh0bWxcIixcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiBcIi80MDQuaHRtbFwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiBcImluZGV4Lmh0bWxcIixcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG5ldyBjZGsuYXdzX2Nsb3VkZnJvbnRfb3JpZ2lucy5TM09yaWdpbihidWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICAgICAgfSksXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5OlxuICAgICAgICAgIGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSX0VYQ0VQVF9IT1NUX0hFQURFUixcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5OiBoZWFkZXJzUG9saWN5LFxuICAgICAgfSxcbiAgICAgIGVuYWJsZUxvZ2dpbmc6IHRydWUsXG4gICAgICBsb2dJbmNsdWRlc0Nvb2tpZXM6IHRydWUsXG4gICAgICBsb2dGaWxlUHJlZml4OiBcImNsb3VkZnJvbnQtbG9ncy9cIixcbiAgICB9KTtcbiAgfVxufVxuIl19