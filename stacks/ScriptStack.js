import { dependsOn, Script, use } from "sst/constructs";
import { AuthAndApiStack } from "./AuthAndApiStack";
import { StorageStack } from "./StorageStack";

export function AfterDeployStack({ stack }) {
  const { tenantTable } = use(StorageStack);
  const { auth, cognitoAccessPolicy } = use(AuthAndApiStack);

  dependsOn(AuthAndApiStack);
  dependsOn(StorageStack);
  new Script(stack, "TopLevelTenant", {
    onCreate: {
      handler: "services/functions/script/topleveltenant.handler",
      environment: { TENANT_TABLE: tenantTable.tableName },
      permissions: [tenantTable],
    },
  });

  new Script(stack, "TopLevelAdmin", {
    onCreate: {
      handler: "services/functions/script/topleveladmin.handler",
      environment: { 
        USER_POOL_ID: auth.userPoolId,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME
     },
      permissions: [cognitoAccessPolicy],
    },
  });

}
