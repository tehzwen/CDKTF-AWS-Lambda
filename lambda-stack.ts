import { Construct } from "constructs";
import { AssetType, TerraformAsset, TerraformStack } from "cdktf";
import { AwsProvider, IamRole, LambdaFunction } from "@cdktf/provider-aws";

interface ILambdaStackProps {
  functionName: string,
  handler: string,
  runtime: string,
  timeout: number,
  path: string,
  rolePolicy?: string,
  region?: string
}

class LambdaStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: ILambdaStackProps) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws-provider', {
      region: props.region ?? 'us-west-2'
    });

    const lambdaAsset = new TerraformAsset(this, `${props.functionName}-Asset-Resource`, {
      path: __dirname + `${props.path}/lib`,
      type: AssetType.ARCHIVE
    });

    const lambdaRole = new IamRole(this, `${props.functionName}-Role-Resource`, {
      assumeRolePolicy: props.rolePolicy ?? `{
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

    new LambdaFunction(this, `${props.functionName}-Resource`, {
      functionName: props.functionName,
      role: lambdaRole.arn,
      handler: props.handler,
      runtime: props.runtime,
      filename: lambdaAsset.path,
      timeout: props.timeout,
      sourceCodeHash: lambdaAsset.assetHash
    });
  }
}

export default LambdaStack;
