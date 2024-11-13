import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { MyWebsiteAppStack } from "../lib/website-stack";

/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: ".env.test" });

describe("MyWebsiteAppStack", () => {
  const app = new cdk.App();

  const websiteStack = new MyWebsiteAppStack(app, "PersonalWebsite", {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    environment: "test",
    domainName: process.env.DOMAIN_NAME || "",
    bucketName: process.env.BUCKET_NAME || "",
  });

  const template = Template.fromStack(websiteStack);

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
      DistributionConfig: Match.objectLike({
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
        DefaultCacheBehavior: Match.anyValue(),
        Enabled: true,
        HttpVersion: "http2",
        IPV6Enabled: true,
        Logging: Match.anyValue(),
        ViewerCertificate: {
          AcmCertificateArn: Match.anyValue(),
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
