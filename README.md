# CDKTF-AWS-Lambda

## What is it?
- Simple project using hashicorp CDKTF in TypeScript to create Lambda functions locally (using zip archives) without the need to upload code to S3

## How to use it?
- Configure your AWS credentials
- Clone this repo
- `yarn` or `npm i`
- Install CDKTF using npm or yarn
- `cdktf synth`     -> Synthesizes your resources
- `cdktf validate`  -> Validates your resources
- `cdktf deploy`    -> Creates your resources
- `cdktf destroy`   -> Destroys your existing resources

## Docs
### `LambdaConstruct`
- Construct wrapper for a lambda function. Creates the lambda function, iam role and zip asset automatically

Constructor Properties:
```ts
functionName:   string,         // Name of the function, no spaces or symbols
handler:        string,         // function name of handler ie. main.handler, index.handler
path:           string,         // path to the files where handler is contained
region?:        string,         // aws region for this lambda (default is us-west-2)
rolePolicy?:    string,         // iam policy for this lambda, basic by default
runtime:        LambdaRunTime,  // enum for what type of lambda this is
timeout?:       number,         // timeout for the lambda function
```

Accessible Properties:
```ts
Function : LambdaFunction // returns the lambda function
Role : IamRole // returns the iam role for this lambda
Asset: TerraformAsset // returns the zip archive asset for this lambda
```

Methods:
```ts
addApiExecutionPermission(api: Apigatewayv2Api) : void // creates a permission for api to invoke this lambda function

addApiIntegration(api: Apigatewayv2Api, type: IntegrationType): Apigatewayv2Integration // creates an integration for this lambda function and the api. type by default is AWS_PROXY
```

Enums:
```ts
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
```



### `ApiGatewayConstruct`
- Construct wrapper for an ApiGatewayV2. Creates the api, and can create routes, deployments, and stages.

Constructor Properties:
```ts
apiName: string, // name for the apigateway
protocolType: ProtocolType // HTTP or WEBSOCKET
```
Accessible Properties:
```ts
Api: Apigatewayv2Api // returns the apigateway
```

Methods:
```ts
addDeployment(deploymentName: string): Apigatewayv2Deployment // creates a deployment for the apigateway
addStage(props: { name: string, autoDeploy?: boolean }): Apigatewayv2Stage // creates a stage for the api, autodeploy is true by default
addRoute(integration: Apigatewayv2Integration,props: {httpMethod: HttpMethod,path:string, routeName: string}): Apigatewayv2Route // Creates a route for the apigateway
```

Enums:
```ts
enum ProtocolType {
  HTTP = "HTTP",
  WEBSOCKET = "WEBSOCKET"
}

enum HttpMethod {
  ANY = "ANY",
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}
```

## Sample Usage:
```ts
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import {
  AwsProvider,
} from "@cdktf/provider-aws";
import LambdaConstruct, { LambdaRunTime } from "./lambda-construct";
import ApiGatewayConstruct, { HttpMethod, ProtocolType } from './apigateway-construct';

interface ILambdaStackProps {
  region?: string
}

class LambdaStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: ILambdaStackProps = {}) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws-provider', {
      region: props.region ?? 'us-west-2'
    });

    const nodeLambdaConstruct = new LambdaConstruct(
      this,
      'LambdaTest',
      {
        path: "../handlers/testHandler/lib",
        functionName: 'TestLambda',
        timeout: 90,
        handler: 'index.handler',
        runtime: LambdaRunTime.NODEJS_14_X
      }
    );

    const pythonLambdaConstruct = new LambdaConstruct(
      this,
      'LambdaPythonTest',
      {
        path: "../handlers/testPython",
        functionName: 'TestPythonLambda',
        timeout: 90,
        handler: 'main.handler',
        runtime: LambdaRunTime.PYTHON_3_8,
      }
    );

    const apiConstruct = new ApiGatewayConstruct(
      this,
      {
        apiName: 'TestApi',
        protocolType: ProtocolType.HTTP
      }
    );

    const homeIntegration = pythonLambdaConstruct.addApiIntegration(apiConstruct.Api);
    const rootIntegration = nodeLambdaConstruct.addApiIntegration(apiConstruct.Api);
    apiConstruct.addRoute(rootIntegration, { httpMethod: HttpMethod.GET, path: "/", routeName: "Root" });
    apiConstruct.addRoute(homeIntegration, { httpMethod: HttpMethod.GET, path: "/home", routeName: 'Home' });
    apiConstruct.addStage({ name: 'TestAPIStage' });
  }
}

export default LambdaStack;

```
