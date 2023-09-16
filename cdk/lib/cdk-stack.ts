import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cfninc from 'aws-cdk-lib/cloudformation-include';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const mainTemplate = new cfninc.CfnInclude(this, 'MainStack', {
      templateFile: '../cfn-templates/main.json',
      loadNestedStacks: {
        'Certificate': {
          templateFile: '../cfn-templates/acmcert.json',
        },
        'Cloudfront': {
          templateFile: '../cfn-templates/cloudfront.json',
        },
        'CustomResources': {
          templateFile: '../cfn-templates/customresources.json',
        },
      },
    });
  }
}
