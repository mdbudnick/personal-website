#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyWebsiteAppStack } from "../lib/website-stack";

const environments = ["test", "staging", "production"];

const app = new cdk.App();
const environment: string = app.node.tryGetContext("environment")?.toString();
if (!environment) {
  throw new Error("An environment must be passed on deploy");
} else if (!environments.includes(environment)) {
  throw new Error("Valid environments are 'staging' or 'production'");
}

/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `.env.${environment}` });

new MyWebsiteAppStack(app, `${environment}-PersonalWebsite`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment,
  domainName: process.env.DOMAIN_NAME || "",
  bucketName: process.env.BUCKET_NAME || "",
});

app.synth();
