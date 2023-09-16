import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cfninc from 'aws-cdk-lib/cloudformation-include';
import { Stack, StackProps } from 'aws-cdk-lib';
import { CloudFrontToApiGatewayToLambda } from '@aws-solutions-constructs/aws-cloudfront-apigateway-lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const mainTemplate = new cfninc.CfnInclude(this, 'MainStack', {
      templateFile: 'cfn-templates/main.yaml',
      loadNestedStacks: {
        'AcmCertificateStack': {
          templateFile: 'cfn-templates/acmcert.yaml',
        },
        'CloudFrontStack': {
          templateFile: 'cfn-templates/cloudfront.yaml',
        },
        'CustomResourceStack': {
          templateFile: 'cfn-templates/customresources.yaml',
        },
      },
    });

    const acmCert = mainTemplate.getNestedStack('AcmCertificateStack').includedTemplate.getResource('Certificate');
    

    const cfApiAndLambda = new CloudFrontToApiGatewayToLambda(this, 'test-cloudfront-apigateway-lambda', {
      lambdaFunctionProps: {
        code: lambda.Code.fromAsset(`lambda`),
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: 'index.handler'
      }
    });

  }
}
