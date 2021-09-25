import { Construct } from "constructs";
import { Resource, TerraformOutput } from "cdktf";
import {
  Apigatewayv2Api,
  Apigatewayv2Deployment,
  Apigatewayv2Integration,
  Apigatewayv2Route,
  Apigatewayv2Stage
} from "@cdktf/provider-aws";

interface IApiGatewayConstructProps {
  apiName: string,
  protocolType: ProtocolType
}

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

class ApiGatewayConstruct extends Resource {
  private _api: Apigatewayv2Api;

  constructor(scope: Construct, props: IApiGatewayConstructProps) {
    super(scope, props.apiName);

    this._api = new Apigatewayv2Api(
      this,
      `${props.apiName}-resource`,
      {
        name: props.apiName,
        protocolType: props.protocolType,
      }
    );
  }

  public addDeployment(deploymentName: string): Apigatewayv2Deployment {
    const deployment = new Apigatewayv2Deployment(
      this,
      deploymentName,
      {
        apiId: this._api.id
      }
    );

    return deployment;
  }

  public addStage(props: { name: string, autoDeploy?: boolean }): Apigatewayv2Stage {
    const auto = props.autoDeploy ?? true;

    const stage = new Apigatewayv2Stage(
      this,
      `${props.name}-resource`,
      {
        apiId: this._api.id,
        name: `${props.name}`,
        autoDeploy: auto
      }
    );

    if (auto) {
      new TerraformOutput(
        this,
        `${props.name}-stage-output`,
        {
          value: stage.invokeUrl
        }
      );
    }

    return stage;
  }

  public addRoute(
    integration: Apigatewayv2Integration,
    props: {
      httpMethod: HttpMethod,
      path: string,
      routeName: string,
    }): Apigatewayv2Route {

    const route = new Apigatewayv2Route(
      this,
      `${props.routeName}-${this._api.name}-route`,
      {
        apiId: this._api.id,
        routeKey: `${props.httpMethod} ${props.path}`,
        target: `integrations/${integration.id}`
      }
    );

    return route;
  }

  public get Api(): Apigatewayv2Api {
    return this._api;
  }
}


export {
  HttpMethod,
  ProtocolType,
}
export default ApiGatewayConstruct;
