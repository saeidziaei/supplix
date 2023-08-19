
import type { SSTConfig } from "sst"
import { AuthAndApiStack } from "./stacks/AuthAndApiStack.js"
import { StorageStack } from "./stacks/StorageStack.js"
import { FrontendStack } from "./stacks/FrontendStack.js"
import { AfterDeployStack } from "./stacks/ScriptStack.js"
import { CronStack } from "./stacks/CronStack.js"

export default {
  config(input) {
    return {
      name: "supplix",
      region: "ap-southeast-2",
    }
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs16.x",
      architecture: "arm_64",
    })

    app
      .stack(StorageStack)  
      .stack(CronStack)
      .stack(AuthAndApiStack)
      .stack(FrontendStack)
      .stack(AfterDeployStack)
  },
} satisfies SSTConfig