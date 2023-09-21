#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticWebsiteBucket } from "../lib/bucket-stack";
import { MyWebsiteAppStack } from "../lib/website-stack";

/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config();

const app = new cdk.App();

new StaticWebsiteBucket(app, "PersonalWebsiteBucket", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  bucketName: process.env.BUCKET_NAME || "",
});


new MyWebsiteAppStack(app, "PersonalWebsite", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stage: "prod",
  domainName: process.env.DOMAIN_NAME || "",
  staticBucketName: process.env.BUCKET_NAME || "",
});

app.synth();
