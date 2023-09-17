import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class MyWebsiteAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const blogTable = new dynamodb.Table(this, 'BlogPosts', {
      partitionKey: { name: 'postId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.RETAIN // Only for dev, use different policy for production.
    });

  const readBlogFunction = new lambda.Function(this, 'ReadBlogFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'read.handler', // You'll need to create this handler function.
    code: lambda.Code.fromAsset('lambda'), // Put your Lambda code in a 'lambda' directory.
  });

  const createBlogFunction = new lambda.Function(this, 'CreateBlogFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'create.handler', // You'll need to create this handler function.
    code: lambda.Code.fromAsset('lambda'),
  });


  blogTable.grantReadData(readBlogFunction);
  blogTable.grantReadWriteData(createBlogFunction);


  const api = new apigateway.RestApi(this, 'BlogApi');

  const readBlogIntegration = new apigateway.LambdaIntegration(readBlogFunction);
  const createBlogIntegration = new apigateway.LambdaIntegration(createBlogFunction);

  api.root.addMethod('GET', readBlogIntegration);
  api.root.addMethod('POST', createBlogIntegration);


  }
}

