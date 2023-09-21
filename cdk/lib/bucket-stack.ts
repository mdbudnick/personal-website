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
    
    const bucket = new s3.Bucket(this, "WebsiteBucket", {
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
        props?.environment != "production"
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
          autoDeleteObjects: props?.environment != "production",
    });

    // We do this to have an explicit dependency
    // Creating an output was not working
    this.bucketName = bucket.bucketName;

    new s3deployment.BucketDeployment(this, "PushFiles", {
      sources: [s3deployment.Source.asset(path)],
      destinationBucket: bucket,
    });
  }
}
