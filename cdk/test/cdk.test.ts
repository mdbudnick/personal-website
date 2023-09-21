import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { StaticWebsiteBucket } from "../lib/bucket-stack";

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
