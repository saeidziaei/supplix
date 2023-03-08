import { AuthAndApiStack } from "./AuthAndApiStack";
import { StorageStack } from "./StorageStack";
import { FrontendStack } from "./FrontendStack";

import { App } from "sst/constructs";

/**
 * @param {App} app
 */
export default function (app) {
  app.setDefaultFunctionProps({
    runtime: "nodejs16.x",
    nodejs: {
      format: "esm",
    },
  });
  app.stack(StorageStack)
     .stack(AuthAndApiStack)
     .stack(FrontendStack);
}
