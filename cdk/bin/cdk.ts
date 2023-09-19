#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyWebsiteAppStack } from '../lib/cdk-stack';

require('dotenv').config()

const app = new cdk.App();
new MyWebsiteAppStack(app, 'PersonalWebsite', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stage: 'prod',
  domainName: process.env.DOMAIN_NAME || '',
  staticBucketName: process.env.BUCKET_NAME || ''
});

app.synth();