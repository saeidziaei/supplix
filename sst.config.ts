
import type { SSTConfig } from "sst"
import { AuthAndApiStack } from "./stacks/AuthAndApiStack.js"
import { StorageStack } from "./stacks/StorageStack.js"
import { AfterDeployStack } from "./stacks/ScriptStack.js"
import { CronStack } from "./stacks/CronStack.js"
import { FrontendStackOld } from "./stacks/FrontendStackOld.js"
import { FrontendStack } from "./stacks/FrontendStack.js"

export default {
  config(input) {
    return {
      name: "supplix",
      region: "ap-southeast-2",
    }
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs18.x",
      architecture: "arm_64",
    })

    app
      .stack(StorageStack)  
      .stack(CronStack)
      .stack(AuthAndApiStack)
      // .stack(FrontendStack)
      .stack(FrontendStackOld)
      .stack(AfterDeployStack)
  },
} satisfies SSTConfig