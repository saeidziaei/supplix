import { dependsOn, Script, use } from "sst/constructs";
import { AuthAndApiStack } from "./AuthAndApiStack";
import { StorageStack } from "./StorageStack";

export function AfterDeployStack({ stack }) {
  const { tenantTable } = use(StorageStack);
  
  dependsOn(AuthAndApiStack);
  dependsOn(StorageStack);
  new Script(stack, "AfterDeploy", {
    onCreate: {
      handler: "services/functions/script/createtenant.handler",
      environment: { TENANT_TABLE: tenantTable.tableName },
      permissions: [tenantTable],
    },
  });
}
