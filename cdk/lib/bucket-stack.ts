import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";

const path = "../www";

export interface StaticWebsiteBucketProps extends cdk.StackProps {
    bucketName: string;
  }

export class StaticWebsiteBucket extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StaticWebsiteBucketProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "Files", {
      websiteIndexDocument: "index.html",
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      },
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    new s3deployment.BucketDeployment(this, "Deployment", {
      sources: [s3deployment.Source.asset(path)],
      destinationBucket: bucket,
    });

    new cdk.CfnOutput(this, "BucketDomain", {
      value: bucket.bucketWebsiteDomainName,
    });
  }
}
