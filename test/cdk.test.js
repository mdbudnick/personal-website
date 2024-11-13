"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const website_stack_1 = require("../lib/website-stack");
/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: ".env.test" });
describe("MyWebsiteAppStack", () => {
    const app = new cdk.App();
    const websiteStack = new website_stack_1.MyWebsiteAppStack(app, "PersonalWebsite", {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        },
        environment: "test",
        domainName: process.env.DOMAIN_NAME || "",
        bucketName: process.env.BUCKET_NAME || "",
    });
    const template = assertions_1.Template.fromStack(websiteStack);
    console.log(JSON.stringify(template));
    test("S3 buckets created", () => {
        // One for website and one for CloudFront logs
        template.resourceCountIs("AWS::S3::Bucket", 2);
    });
    test("S3 bucket name is env variable", () => {
        template.hasResourceProperties("AWS::S3::Bucket", {
            BucketName: process.env.BUCKET_NAME,
        });
    });
    test("ACM Certificate Created", () => {
        template.resourceCountIs("AWS::CertificateManager::Certificate", 1);
        template.hasResourceProperties("AWS::CertificateManager::Certificate", {
            DomainName: process.env.DOMAIN_NAME,
            SubjectAlternativeNames: ["*." + process.env.DOMAIN_NAME],
        });
    });
    const hostedZoneName = "testing.";
    test("Route53 HostedZone is present", () => {
        template.resourceCountIs("AWS::Route53::HostedZone", 1);
        template.hasResourceProperties("AWS::Route53::HostedZone", {
            Name: hostedZoneName,
        });
    });
    test("Route53 RecordSets Created", () => {
        template.resourceCountIs("AWS::Route53::RecordSet", 2);
        template.hasResourceProperties("AWS::Route53::RecordSet", {
            Name: ["www", process.env.DOMAIN_NAME, hostedZoneName].join("."),
            Type: "CNAME",
        });
        template.hasResourceProperties("AWS::Route53::RecordSet", {
            Name: [process.env.DOMAIN_NAME, hostedZoneName].join("."),
            Type: "A",
        });
    });
    test("Route53 RecordSet Deleted", () => {
        // CNAME and alias A
        template.resourceCountIs("Custom::DeleteExistingRecordSet", 2);
    });
    test("Cloudfront Distribution Created", () => {
        template.resourceCountIs("AWS::CloudFront::Distribution", 1);
        template.hasResourceProperties("AWS::CloudFront::Distribution", {
            DistributionConfig: assertions_1.Match.objectLike({
                Aliases: [process.env.DOMAIN_NAME, "www." + process.env.DOMAIN_NAME],
                CustomErrorResponses: [
                    {
                        ErrorCode: 403,
                        ResponseCode: 403,
                        ResponsePagePath: "/index.html",
                    },
                    {
                        ErrorCode: 404,
                        ResponseCode: 404,
                        ResponsePagePath: "/404.html",
                    },
                ],
                DefaultCacheBehavior: assertions_1.Match.anyValue(),
                Enabled: true,
                HttpVersion: "http2",
                IPV6Enabled: true,
                Logging: assertions_1.Match.anyValue(),
                ViewerCertificate: {
                    AcmCertificateArn: assertions_1.Match.anyValue(),
                    MinimumProtocolVersion: "TLSv1.2_2018",
                    SslSupportMethod: "sni-only",
                },
            }),
        });
    });
    test("Cloudfront ResponseHeadersPolicy Created", () => {
        template.resourceCountIs("AWS::CloudFront::ResponseHeadersPolicy", 1);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2RrLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjZGsudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUNuQyx1REFBeUQ7QUFDekQsd0RBQXlEO0FBRXpELHVEQUF1RDtBQUN2RCxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFFaEQsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtJQUNqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUUxQixNQUFNLFlBQVksR0FBRyxJQUFJLGlDQUFpQixDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRTtRQUNqRSxHQUFHLEVBQUU7WUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7WUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCO1NBQ3ZDO1FBQ0QsV0FBVyxFQUFFLE1BQU07UUFDbkIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLEVBQUU7UUFDekMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxJQUFJLEVBQUU7S0FDMUMsQ0FBQyxDQUFDO0lBRUgsTUFBTSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7SUFFbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFFdEMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUM5Qiw4Q0FBOEM7UUFDOUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNqRCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxHQUFH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QUUsa0JBQUssQ0FBQyxRQUFRLEVBQUU7b0JBQ25DLHNCQUFzQixFQUFFLGNBQWM7b0JBQ3RDLGdCQUFnQixFQUFFLFVBQVU7aUJBQzdCO2FBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtRQUNwRCxRQUFRLENBQUMsZUFBZSxDQUFDLHdDQUF3QyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBNYXRjaCwgVGVtcGxhdGUgfSBmcm9tIFwiYXdzLWNkay1saWIvYXNzZXJ0aW9uc1wiO1xuaW1wb3J0IHsgTXlXZWJzaXRlQXBwU3RhY2sgfSBmcm9tIFwiLi4vbGliL3dlYnNpdGUtc3RhY2tcIjtcblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlcyAqL1xucmVxdWlyZShcImRvdGVudlwiKS5jb25maWcoeyBwYXRoOiBcIi5lbnYudGVzdFwiIH0pO1xuXG5kZXNjcmliZShcIk15V2Vic2l0ZUFwcFN0YWNrXCIsICgpID0+IHtcbiAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuICBjb25zdCB3ZWJzaXRlU3RhY2sgPSBuZXcgTXlXZWJzaXRlQXBwU3RhY2soYXBwLCBcIlBlcnNvbmFsV2Vic2l0ZVwiLCB7XG4gICAgZW52OiB7XG4gICAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04sXG4gICAgfSxcbiAgICBlbnZpcm9ubWVudDogXCJ0ZXN0XCIsXG4gICAgZG9tYWluTmFtZTogcHJvY2Vzcy5lbnYuRE9NQUlOX05BTUUgfHwgXCJcIixcbiAgICBidWNrZXROYW1lOiBwcm9jZXNzLmVudi5CVUNLRVRfTkFNRSB8fCBcIlwiLFxuICB9KTtcblxuICBjb25zdCB0ZW1wbGF0ZSA9IFRlbXBsYXRlLmZyb21TdGFjayh3ZWJzaXRlU3RhY2spO1xuXG4gIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRlbXBsYXRlKSk7XG5cbiAgdGVzdChcIlMzIGJ1Y2tldHMgY3JlYXRlZFwiLCAoKSA9PiB7XG4gICAgLy8gT25lIGZvciB3ZWJzaXRlIGFuZCBvbmUgZm9yIENsb3VkRnJvbnQgbG9nc1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcyhcIkFXUzo6UzM6OkJ1Y2tldFwiLCAyKTtcbiAgfSk7XG5cbiAgdGVzdChcIlMzIGJ1Y2tldCBuYW1lIGlzIGVudiB2YXJpYWJsZVwiLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKFwiQVdTOjpTMzo6QnVja2V0XCIsIHtcbiAgICAgIEJ1Y2tldE5hbWU6IHByb2Nlc3MuZW52LkJVQ0tFVF9OQU1FLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KFwiQUNNIENlcnRpZmljYXRlIENyZWF0ZWRcIiwgKCkgPT4ge1xuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcyhcIkFXUzo6Q2VydGlmaWNhdGVNYW5hZ2VyOjpDZXJ0aWZpY2F0ZVwiLCAxKTtcblxuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcyhcIkFXUzo6Q2VydGlmaWNhdGVNYW5hZ2VyOjpDZXJ0aWZpY2F0ZVwiLCB7XG4gICAgICBEb21haW5OYW1lOiBwcm9jZXNzLmVudi5ET01BSU5fTkFNRSxcbiAgICAgIFN1YmplY3RBbHRlcm5hdGl2ZU5hbWVzOiBbXCIqLlwiICsgcHJvY2Vzcy5lbnYuRE9NQUlOX05BTUVdLFxuICAgIH0pO1xuICB9KTtcblxuICBjb25zdCBob3N0ZWRab25lTmFtZSA9IFwidGVzdGluZy5cIjtcbiAgdGVzdChcIlJvdXRlNTMgSG9zdGVkWm9uZSBpcyBwcmVzZW50XCIsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoXCJBV1M6OlJvdXRlNTM6Okhvc3RlZFpvbmVcIiwgMSk7XG5cbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoXCJBV1M6OlJvdXRlNTM6Okhvc3RlZFpvbmVcIiwge1xuICAgICAgTmFtZTogaG9zdGVkWm9uZU5hbWUsXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoXCJSb3V0ZTUzIFJlY29yZFNldHMgQ3JlYXRlZFwiLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKFwiQVdTOjpSb3V0ZTUzOjpSZWNvcmRTZXRcIiwgMik7XG5cbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoXCJBV1M6OlJvdXRlNTM6OlJlY29yZFNldFwiLCB7XG4gICAgICBOYW1lOiBbXCJ3d3dcIiwgcHJvY2Vzcy5lbnYuRE9NQUlOX05BTUUsIGhvc3RlZFpvbmVOYW1lXS5qb2luKFwiLlwiKSxcbiAgICAgIFR5cGU6IFwiQ05BTUVcIixcbiAgICB9KTtcblxuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcyhcIkFXUzo6Um91dGU1Mzo6UmVjb3JkU2V0XCIsIHtcbiAgICAgIE5hbWU6IFtwcm9jZXNzLmVudi5ET01BSU5fTkFNRSwgaG9zdGVkWm9uZU5hbWVdLmpvaW4oXCIuXCIpLFxuICAgICAgVHlwZTogXCJBXCIsXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoXCJSb3V0ZTUzIFJlY29yZFNldCBEZWxldGVkXCIsICgpID0+IHtcbiAgICAvLyBDTkFNRSBhbmQgYWxpYXMgQVxuICAgIHRlbXBsYXRlLnJlc291cmNlQ291bnRJcyhcIkN1c3RvbTo6RGVsZXRlRXhpc3RpbmdSZWNvcmRTZXRcIiwgMik7XG4gIH0pO1xuXG4gIHRlc3QoXCJDbG91ZGZyb250IERpc3RyaWJ1dGlvbiBDcmVhdGVkXCIsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoXCJBV1M6OkNsb3VkRnJvbnQ6OkRpc3RyaWJ1dGlvblwiLCAxKTtcblxuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcyhcIkFXUzo6Q2xvdWRGcm9udDo6RGlzdHJpYnV0aW9uXCIsIHtcbiAgICAgIERpc3RyaWJ1dGlvbkNvbmZpZzogTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICAgIEFsaWFzZXM6IFtwcm9jZXNzLmVudi5ET01BSU5fTkFNRSwgXCJ3d3cuXCIgKyBwcm9jZXNzLmVudi5ET01BSU5fTkFNRV0sXG4gICAgICAgIEN1c3RvbUVycm9yUmVzcG9uc2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgRXJyb3JDb2RlOiA0MDMsXG4gICAgICAgICAgICBSZXNwb25zZUNvZGU6IDQwMyxcbiAgICAgICAgICAgIFJlc3BvbnNlUGFnZVBhdGg6IFwiL2luZGV4Lmh0bWxcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIEVycm9yQ29kZTogNDA0LFxuICAgICAgICAgICAgUmVzcG9uc2VDb2RlOiA0MDQsXG4gICAgICAgICAgICBSZXNwb25zZVBhZ2VQYXRoOiBcIi80MDQuaHRtbFwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIERlZmF1bHRDYWNoZUJlaGF2aW9yOiBNYXRjaC5hbnlWYWx1ZSgpLFxuICAgICAgICBFbmFibGVkOiB0cnVlLFxuICAgICAgICBIdHRwVmVyc2lvbjogXCJodHRwMlwiLFxuICAgICAgICBJUFY2RW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgTG9nZ2luZzogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgICAgVmlld2VyQ2VydGlmaWNhdGU6IHtcbiAgICAgICAgICBBY21DZXJ0aWZpY2F0ZUFybjogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgICAgICBNaW5pbXVtUHJvdG9jb2xWZXJzaW9uOiBcIlRMU3YxLjJfMjAxOFwiLFxuICAgICAgICAgIFNzbFN1cHBvcnRNZXRob2Q6IFwic25pLW9ubHlcIixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIH0pO1xuICB9KTtcblxuICB0ZXN0KFwiQ2xvdWRmcm9udCBSZXNwb25zZUhlYWRlcnNQb2xpY3kgQ3JlYXRlZFwiLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKFwiQVdTOjpDbG91ZEZyb250OjpSZXNwb25zZUhlYWRlcnNQb2xpY3lcIiwgMSk7XG4gIH0pO1xufSk7XG4iXX0=