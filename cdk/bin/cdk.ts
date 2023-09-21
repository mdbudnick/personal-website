#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { StaticWebsiteBucket } from "../lib/bucket-stack";
import { MyWebsiteAppStack } from "../lib/website-stack";


const app = new cdk.App();
const environment = app.node.tryGetContext("environment")?.toString();
if (!environment) {
  throw new Error("An environment must be passed on deploy")
} else if (!["production", "development"].includes(environment)) {
  throw new Error("Valid environments are 'production' or 'development'")
}

/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `.env.${environment}` });

const bucketStack = new StaticWebsiteBucket(app, "PersonalWebsiteBucket", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment,
  bucketName: process.env.BUCKET_NAME || "",
});


new MyWebsiteAppStack(app, "PersonalWebsite", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment,
  domainName: process.env.DOMAIN_NAME || "",
  staticBucketName: bucketStack.bucketName,
});

app.synth();
