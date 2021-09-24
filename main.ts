import { App } from "cdktf";
import LambdaStack from "./lambda-stack";

const app = new App();
new LambdaStack(app, "cdktf-test", {
  path: "/handlers/testHandler",
  functionName: 'TestLambda',
  timeout: 90,
  handler: 'index.handler',
  runtime: 'nodejs14.x'
});
app.synth();
