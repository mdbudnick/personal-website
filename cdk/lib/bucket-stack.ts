import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment";

const path = "../www";

export interface StaticWebsiteBucketProps extends cdk.StackProps {
  environment: string;
  bucketName: string;
}

export class StaticWebsiteBucket extends cdk.Stack {
    public readonly bucketName: string;

  constructor(scope: Construct, id: string, props?: StaticWebsiteBucketProps) {
    super(scope, id, props);
    
    const bucket = new s3.Bucket(this, "WebsiteFiles", {
      bucketName: props?.bucketName,
      websiteIndexDocument: "index.html",
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      publicReadAccess: true,
      removalPolicy:
        props?.environment == "development"
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
          autoDeleteObjects: props?.environment == "development",
    });

    new s3deployment.BucketDeployment(this, "PushFiles", {
      sources: [s3deployment.Source.asset(path)],
      destinationBucket: bucket,
    });

    this.bucketName = bucket.bucketName;
  }
}
