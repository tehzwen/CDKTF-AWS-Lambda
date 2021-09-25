import { App } from "cdktf";
import LambdaStack from "./src/lambda-stack";

const app = new App();
new LambdaStack(app, "cdktf-test");
app.synth();
