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
