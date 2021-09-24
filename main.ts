import { Construct } from "constructs";
import { App, AssetType, TerraformAsset, TerraformStack } from "cdktf";
import { AwsProvider, IamRole, LambdaFunction } from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws-provider', {
      region: 'us-west-2'
    });

    const lambdaAsset = new TerraformAsset(this, 'lambda-asset', {
      path: __dirname + "/handlers/testHandler/lib",
      type: AssetType.ARCHIVE
    });

    const lambdaRole = new IamRole(this, 'lambda-role', {
      assumeRolePolicy: `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
          }
        ]
      }`
    });

    new LambdaFunction(this, 'TestLambda', {
      functionName: 'TestLambda',
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs14.x',
      filename: lambdaAsset.path,
      timeout: 90,
      sourceCodeHash: lambdaAsset.assetHash
    });
  }
}

const app = new App();
new MyStack(app, "cdktf-test");
app.synth();
