import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { StaticWebsiteBucket } from "../lib/bucket-stack";
import { MyWebsiteAppStack } from "../lib/website-stack"

/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: ".env.test" });

describe("PersonalWebsiteBucket", () => {
  const app = new cdk.App();

  const bucketStack = new StaticWebsiteBucket(app, "PersonalWebsiteBucket", {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    environment: "test",
    bucketName: process.env.BUCKET_NAME || "",
  });

  const template = Template.fromStack(bucketStack);

  test("S3 bucket created", () => {
    template.resourceCountIs("AWS::S3::Bucket", 1);
  });

  test("S3 bucket name is env variable", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: process.env.BUCKET_NAME,
    });
  });

  test("S3 bucket has public access set", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        BlockPublicPolicy: false,
        IgnorePublicAcls: false,
        RestrictPublicBuckets: false,
      },
    });
  });

  test("S3 bucket has index.html as defult", () => {
    template.hasResourceProperties("AWS::S3::Bucket", {
      WebsiteConfiguration: { IndexDocument: "index.html" },
    });
  });
});

describe("PersonalWebsiteBucket", () => {
    const app = new cdk.App();
  
    const websiteStack = new MyWebsiteAppStack(app, "PersonalWebsite", {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
          },
          environment: "test",
          domainName: process.env.DOMAIN_NAME || "",
          staticBucketName: process.env.BUCKET_NAME!,
    });
  
    const template = Template.fromStack(websiteStack);
  
    test("Lambda Functions Created", () => {
      // 1 each for Read and Create blog posts
      // 1 for replacing the CNAME record
      template.resourceCountIs("AWS::Lambda::Function", 3);

      template.hasResourceProperties("AWS::Lambda::Function", {
        Handler: "create.handler",
        Runtime: "nodejs16.x",
      });

      template.hasResourceProperties("AWS::Lambda::Function", {
        Handler: "read.handler",
        Runtime: "nodejs16.x",
      });
    });
  
    test("APIGateway Created", () => {
        template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
        // 1 GET and 1 POST
        template.resourceCountIs("AWS::ApiGateway::Method", 2);

        template.hasResourceProperties("AWS::ApiGateway::RestApi", {
            "Name": "BlogApi"
        });
      });
    
      test("ACM Certificate Created", () => {
        template.resourceCountIs("AWS::CertificateManager::Certificate", 1);

        template.hasResourceProperties("AWS::CertificateManager::Certificate", {
            "DomainName": process.env.DOMAIN_NAME,
            "SubjectAlternativeNames": [
                "*." + process.env.DOMAIN_NAME
              ]
        });
      });

      test("Route53 RecordSet Created", () => {

      })

      test("Route53 RecordSet Created", () => {
        template.resourceCountIs("AWS::Route53::RecordSet", 1);
        
        template.hasResourceProperties("AWS::Route53::RecordSet", {
            "Name": ["www", process.env.DOMAIN_NAME, "testing."].join("."),
            "Type": "CNAME"
        });
      });

      test("Route53 RecordSet Deleted", () => {
        template.resourceCountIs("Custom::DeleteExistingRecordSet", 1);
      })

      test("Cloudfront Distribution Created", () => {
        template.resourceCountIs("AWS::CloudFront::Distribution", 1);
      })

      test("Cloudfront ResponseHeadersPolicy Created", () => {
        template.resourceCountIs("AWS::CloudFront::ResponseHeadersPolicy", 1);
      });

      test("Cloudfront's S3BucketPolicy Created", () => {
        template.resourceCountIs("AWS::S3::BucketPolicy", 1);
      });
  });
