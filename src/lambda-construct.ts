import { Construct } from "constructs";
import { AssetType, Resource, TerraformAsset } from "cdktf";
import { Apigatewayv2Api, Apigatewayv2Integration, IamRole, LambdaFunction, LambdaPermission } from "@cdktf/provider-aws";

interface ILambdaConstructProps {
  functionName: string,
  handler: string,
  path: string,
  region?: string,
  rolePolicy?: string,
  runtime: LambdaRunTime,
  timeout?: number,
}

enum IntegrationType {
  AWS_PROXY = "AWS_PROXY",
  HTTP = "HTTP",
  MOCK = "MOCK",
  HTTP_PROXY = "HTTP_PROXY",
  VPC_LINK = "VPC_LINK"
}

enum LambdaRunTime {
  NODEJS = "nodejs",
  NODEJS_12_X = "nodejs12.x",
  NODEJS_14_X = "nodejs14.x",
  JAVA_8 = "java8",
  JAVA_8_AL2 = "java8.al2",
  JAVA_11 = "java11",
  PYTHON_2_7 = "python2.7",
  PYTHON_3_6 = "python3.6",
  PYTHON_3_7 = "python3.7",
  PYTHON_3_8 = "python3.8",
  PYTHON_3_9 = "python3.9",
  DOTNET_CORE_1_0 = "dotnetcore1.0",
  DOTNET_CORE_2_0 = "dotnetcore2.0",
  DOTNET_CORE_2_1 = "dotnetcore2.1",
  DOTNET_CORE_3_1 = "dotnetcore3.1",
  GO_1_X = "go1.x",
  RUBY_2_5 = "ruby2.5",
  RUBY_2_7 = "ruby2.7",
  PROVIDED = "provided",
  PROVIDED_AL_2 = "provided.al2"
}

class LambdaConstruct extends Resource {
  private _asset: TerraformAsset;
  private _function: LambdaFunction;
  private _role: IamRole;

  constructor(scope: Construct, name: string, props: ILambdaConstructProps) {
    super(scope, name);

    this._asset = new TerraformAsset(this, `${props.functionName}-Asset-Resource`, {
      path: `${__dirname}/${props.path}`,
      type: AssetType.ARCHIVE
    });

    this._role = new IamRole(this, `${props.functionName}-Role-Resource`, {
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
      }`,
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      ]
    });

    this._function = new LambdaFunction(this, `${props.functionName}-Resource`, {
      functionName: props.functionName,
      role: this._role.arn,
      handler: props.handler,
      runtime: props.runtime,
      filename: this._asset.path,
      timeout: props.timeout ?? 30,
      sourceCodeHash: this._asset.assetHash
    });
  }

  public get Function(): LambdaFunction {
    return this._function;
  }

  public get Role(): IamRole {
    return this._role;
  }

  public get Asset(): TerraformAsset {
    return this._asset;
  }

  public addApiExecutionPermission(api: Apigatewayv2Api): void {
    new LambdaPermission(
      this,
      `${this._function.functionName}-${api.name}-lambda-permission`,
      {
        functionName: this._function.functionName,
        action: 'lambda:InvokeFunction',
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${api.executionArn}/*/*`,
      }
    );
  }

  public addApiIntegration(api: Apigatewayv2Api, type: IntegrationType = IntegrationType.AWS_PROXY): Apigatewayv2Integration {
    this.addApiExecutionPermission(api);

    return new Apigatewayv2Integration(
      this,
      'TestApiIntegration',
      {
        apiId: api.id,
        integrationType: type,
        integrationUri: this._function.invokeArn,
      }
    );
  }
}

export {
  IntegrationType,
  LambdaRunTime
}

export default LambdaConstruct;
