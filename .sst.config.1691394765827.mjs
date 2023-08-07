import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/AuthAndApiStack.js
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Cognito, Api, use } from "sst/constructs";

// stacks/StorageStack.js
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";
import { Bucket, Table } from "sst/constructs";
function StorageStack({ stack, app }) {
  const bucket = new Bucket(stack, "Uploads", {
    cors: [
      {
        maxAge: "1 day",
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"]
      }
    ]
  });
  const tenantTable = new Table(stack, "Tenant", {
    fields: {
      tenantId: "string"
    },
    primaryIndex: { partitionKey: "tenantId" }
  });
  const userTable = new Table(stack, "User", {
    fields: {
      tenant: "string",
      Username: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "Username" }
  });
  const workspaceTable = new Table(stack, "Workspace", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      name: "string",
      parentId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "workspaceId" }
  });
  const deletedArchiveTable = new Table(stack, "DeletedArchive", {
    fields: {
      tenant: "string",
      deletedAt: "number"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "deletedAt" }
  });
  const workspaceTaskTable = new Table(stack, "WorkspaceTask", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      taskId: "string",
      userId: "string"
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "taskId" },
    globalIndexes: {
      userIndex: { partitionKey: "tenant", sortKey: "userId" }
    },
    stream: "new_and_old_images"
  });
  const workspaceUserTable = new Table(stack, "WorkspaceUser", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      userId: "string",
      role: "string"
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "userId" }
  });
  const isoTable = new Table(stack, "Iso", {
    fields: {
      tenant: "string",
      isoId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "isoId" }
  });
  const formTable = new Table(stack, "Form", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      formId: "string"
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "formId" }
  });
  const templateTable = new Table(stack, "Template", {
    fields: {
      tenant: "string",
      templateId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "templateId" }
  });
  const docTable = new Table(stack, "Doc", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      docId: "string"
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "docId" }
  });
  return {
    tenantTable,
    userTable,
    isoTable,
    templateTable,
    formTable,
    docTable,
    workspaceTable,
    workspaceUserTable,
    workspaceTaskTable,
    deletedArchiveTable,
    bucket
  };
}
__name(StorageStack, "StorageStack");

// services/util/constants.js
var TOP_LEVEL_ADMIN_GROUP = "top-level-admins";
var ADMIN_GROUP = "admins";
var WORKSPACE_OWNER_ROLE = "Owner";

// stacks/AuthAndApiStack.js
import { StringAttribute } from "aws-cdk-lib/aws-cognito";
function AuthAndApiStack({ stack, app }) {
  const {
    bucket,
    templateTable,
    tenantTable,
    userTable,
    isoTable,
    formTable,
    docTable,
    workspaceTable,
    workspaceUserTable,
    workspaceTaskTable,
    deletedArchiveTable
  } = use(StorageStack);
  const tenantAttribute = new StringAttribute({
    name: "custom:tenant",
    mutable: false
  });
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
    cdk: {
      userPool: {
        customAttributes: {
          tenant: tenantAttribute
        }
      },
      emailSettings: {
        fromEmail: "noreply@isocloud.com.au",
        replyToEmail: "noreply@isocloud.com.au",
        emailSubject: "Welcome to ISO Cloud",
        verificationMessage: "Your verification code is {####}",
        welcomeMessage: "Welcome to ISO Cloud! Your username is {username}",
        passwordResetMessage: "Your password reset code is {####}"
      }
    }
  });
  const topLevelAdminsGroup = new cognito.CfnUserPoolGroup(
    stack,
    "TopLevelAdmins",
    {
      groupName: TOP_LEVEL_ADMIN_GROUP,
      userPoolId: auth.userPoolId
    }
  );
  const adminsGroup = new cognito.CfnUserPoolGroup(
    stack,
    "Admins",
    {
      groupName: ADMIN_GROUP,
      userPoolId: auth.userPoolId
    }
  );
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminUser = new cognito.CfnUserPoolUser(stack, "AdminUser", {
    userPoolId: auth.userPoolId,
    username: adminUsername,
    desiredDeliveryMediums: ["EMAIL"],
    forceAliasCreation: true,
    userAttributes: [
      { name: "email", value: process.env.ADMIN_EMAIL },
      { name: "custom:tenant", value: "isocloud" }
    ]
  });
  const cognitoAccessPolicy = new iam.PolicyStatement({
    actions: ["cognito-idp:*"],
    effect: iam.Effect.ALLOW,
    resources: [
      `arn:aws:cognito-idp:${app.region}:${app.account}:userpool/${auth.userPoolId}`
    ]
  });
  const cognitoReadonlyAccessPolicy = new iam.PolicyStatement({
    actions: ["cognito-idp:Describe*", "cognito-idp:AdminGetUser"],
    effect: iam.Effect.ALLOW,
    resources: [
      `arn:aws:cognito-idp:${app.region}:${app.account}:userpool/${auth.userPoolId}`
    ]
  });
  const api = new Api(stack, "Api", {
    cors: true,
    authorizers: {
      jwt: {
        type: "user_pool",
        userPool: {
          id: auth.userPoolId,
          clientIds: [auth.userPoolClientId]
        }
      }
    },
    customDomain: app.stage === "prod" ? `api.${process.env.DOMAIN}` : void 0,
    defaults: {
      authorizer: "jwt",
      function: {
        environment: {
          TEMPLATE_TABLE: templateTable.tableName,
          TENANT_TABLE: tenantTable.tableName,
          USER_TABLE: userTable.tableName,
          ISO_TABLE: isoTable.tableName,
          FORM_TABLE: formTable.tableName,
          DOC_TABLE: docTable.tableName,
          WORKSPACE_TABLE: workspaceTable.tableName,
          WORKSPACEUSER_TABLE: workspaceUserTable.tableName,
          WORKSPACETASK_TABLE: workspaceTaskTable.tableName,
          DELETEDARCHIVE_TABLE: deletedArchiveTable.tableName,
          BUCKET: bucket.bucketName
        },
        permissions: [workspaceUserTable]
      }
    },
    routes: {
      "GET   /workspaces": {
        function: {
          handler: "services/functions/workspace/list.main",
          bind: [workspaceTable]
        }
      },
      "GET   /workspaces/{workspaceId}": {
        function: {
          handler: "services/functions/workspace/get.main",
          bind: [workspaceTable]
        }
      },
      "POST   /workspaces": {
        function: {
          handler: "services/functions/workspace/create.main",
          bind: [workspaceTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "PUT   /workspaces/{workspaceId}": {
        function: {
          handler: "services/functions/workspace/update.main",
          bind: [workspaceTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "DELETE   /workspaces/{workspaceId}": {
        function: {
          handler: "services/functions/workspace/delete.main",
          bind: [workspaceTable, deletedArchiveTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "GET   /myworkspaces": {
        function: {
          handler: "services/functions/workspacemember/getmyworkspaces.main",
          bind: [workspaceTable]
        }
      },
      "GET   /workspaces/{workspaceId}/members": {
        function: {
          handler: "services/functions/workspacemember/list.main",
          bind: [workspaceUserTable, workspaceTable]
        }
      },
      "POST  /workspaces/{workspaceId}/members": {
        function: {
          handler: "services/functions/workspacemember/create.main",
          bind: [workspaceUserTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE
          }
        }
      },
      "DELETE /workspaces/{workspaceId}/members/{userId}": {
        function: {
          handler: "services/functions/workspacemember/delete.main",
          bind: [workspaceUserTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE
          }
        }
      },
      "GET   /mytasks": {
        function: {
          handler: "services/functions/workspacetask/getmytasks.main",
          bind: [workspaceTaskTable]
        }
      },
      "GET   /workspaces/{workspaceId}/tasks": {
        function: {
          handler: "services/functions/workspacetask/list.main",
          bind: [workspaceTaskTable]
        }
      },
      "GET   /workspaces/{workspaceId}/tasks/{taskId}": {
        function: {
          handler: "services/functions/workspacetask/get.main",
          bind: [workspaceTaskTable]
        }
      },
      "POST  /workspaces/{workspaceId}/tasks": {
        function: {
          handler: "services/functions/workspacetask/create.main",
          bind: [workspaceTaskTable]
        }
      },
      "PUT  /workspaces/{workspaceId}/tasks/{taskId}": {
        function: {
          handler: "services/functions/workspacetask/update.main",
          bind: [workspaceTaskTable]
        }
      },
      "DELETE /workspaces/{workspaceId}/tasks/{taskId}": {
        function: {
          handler: "services/functions/workspacetask/delete.main",
          bind: [workspaceUserTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE
          }
        }
      },
      "POST /docs/upload-url": {
        function: {
          handler: "services/functions/doc/getUrlForPut.main"
        }
      },
      "GET /workspaces/{workspaceId}/docs": {
        function: {
          handler: "services/functions/doc/list.main",
          bind: [docTable, workspaceTable]
        }
      },
      "GET /workspaces/{workspaceId}/docs/{docId}": {
        function: {
          handler: "services/functions/doc/get.main",
          bind: [docTable, workspaceTable]
        }
      },
      "POST /workspaces/{workspaceId}/docs": {
        function: {
          handler: "services/functions/doc/create.main",
          bind: [docTable]
        }
      },
      "DELETE /workspaces/{workspaceId}/docs/{docId}": {
        function: {
          handler: "services/functions/doc/delete.main",
          bind: [docTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE
          }
        }
      },
      "GET   /workspaces/{workspaceId}/forms": {
        function: {
          handler: "services/functions/form/list.main",
          bind: [workspaceTable]
        }
      },
      "GET /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/get.main",
          bind: [templateTable, formTable, workspaceTable]
        }
      },
      "POST  /workspaces/{workspaceId}/forms": {
        function: {
          handler: "services/functions/form/create.main",
          permissions: [cognitoReadonlyAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          },
          bind: [formTable]
        }
      },
      "PUT /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/update.main",
          permissions: [cognitoReadonlyAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          },
          bind: [formTable]
        }
      },
      "DELETE /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/delete.main",
          bind: [formTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE
          }
        }
      },
      "GET   /templates": {
        function: {
          handler: "services/functions/template/list.main",
          bind: [templateTable]
        }
      },
      "GET   /workspaces/{workspaceId}/templates": {
        function: {
          handler: "services/functions/template/listWithFormCount.main",
          bind: [templateTable, formTable, workspaceTable]
        }
      },
      "GET   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/get.main",
          bind: [templateTable, formTable]
        }
      },
      "POST   /templates": {
        function: {
          handler: "services/functions/template/create.main",
          bind: [templateTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "PUT   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/update.main",
          bind: [templateTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "GET   /workspaces/{workspaceId}/templates/{templateId}/forms": {
        function: {
          handler: "services/functions/template/listForms.main",
          bind: [formTable, workspaceTable]
        }
      },
      "GET   /isos/top-level": {
        function: {
          handler: "services/functions/iso/get.main",
          bind: [isoTable]
        }
      },
      "PUT   /isos/top-level": {
        function: {
          handler: "services/functions/iso/update.main",
          bind: [isoTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "GET   /tenants": {
        function: {
          handler: "services/functions/tenant/list.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "GET   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/get.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "POST   /tenants": {
        function: {
          handler: "services/functions/tenant/create.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "PUT   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/update.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "DELETE   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/delete.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "GET   /mytenant": {
        function: {
          handler: "services/functions/tenant/getmytenant.main",
          bind: [tenantTable],
          environment: {}
        }
      },
      "GET /myuser": {
        function: {
          handler: "services/functions/user/get.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          }
        }
      },
      "GET /users": {
        function: {
          handler: "services/functions/user/list.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          }
        }
      },
      "GET /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/list.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "GET /users/{username}": {
        function: {
          handler: "services/functions/user/get.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "GET /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/get.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "POST /users": {
        function: {
          handler: "services/functions/user/create.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "POST /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/create.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "PUT /users/{username}": {
        function: {
          handler: "services/functions/user/update.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "PUT /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/update.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      },
      "DELETE /users/{username}": {
        function: {
          handler: "services/functions/user/delete.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "DELETE /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/delete.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        }
      }
    }
  });
  api.attachPermissionsToRoute("POST /docs/upload-url", [
    "s3"
  ]);
  api.attachPermissionsToRoute("GET /workspaces/{workspaceId}/docs/{docId}", ["s3"]);
  api.attachPermissionsToRoute("GET /workspaces/{workspaceId}/forms/{formId}", ["s3"]);
  api.attachPermissionsToRoute("PUT /workspaces/{workspaceId}/forms/{formId}", ["s3"]);
  api.attachPermissionsToRoute("GET /users/{username}", ["s3"]);
  api.attachPermissionsToRoute("GET /users", ["s3"]);
  api.attachPermissionsToRoute("GET /tenants/{tenantId}/users", ["s3"]);
  api.attachPermissionsToRoute("GET /myuser", ["s3"]);
  workspaceTaskTable.addConsumers(stack, {
    notify: {
      handler: "services/functions/workspacetask/notify.main",
      permissions: [cognitoReadonlyAccessPolicy],
      environment: {
        USER_POOL_ID: auth.userPoolId
      }
    }
  });
  workspaceTaskTable.attachPermissionsToConsumer("notify", ["ses"]);
  auth.attachPermissionsForAuthUsers(auth, [
    api,
    new iam.PolicyStatement({
      actions: ["s3:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        bucket.bucketArn + "/public/*"
      ]
    })
  ]);
  stack.addOutputs({
    Account: app.account,
    Region: app.region,
    UserPoolId: auth.userPoolId,
    IdentityPoolId: auth.cognitoIdentityPoolId,
    UserPoolClientId: auth.userPoolClientId,
    ApiEndpoint: api.customDomainUrl || api.url
  });
  return {
    auth,
    api,
    cognitoAccessPolicy
  };
}
__name(AuthAndApiStack, "AuthAndApiStack");

// stacks/FrontendStack.js
import { StaticSite, use as use2 } from "sst/constructs";
function FrontendStack({ stack, app }) {
  const { api, auth } = use2(AuthAndApiStack);
  const { bucket } = use2(StorageStack);
  const site = new StaticSite(stack, "ReactSite", {
    customDomain: app.stage === "prod" ? {
      domainName: `${process.env.DOMAIN}`,
      domainAlias: `www.${process.env.DOMAIN}`
    } : void 0,
    path: "frontend",
    buildCommand: "npm run build",
    buildOutput: "build",
    environment: {
      REACT_APP_API_URL: api.customDomainUrl || api.url,
      REACT_APP_REGION: app.region,
      REACT_APP_BUCKET: bucket.bucketName,
      REACT_APP_USER_POOL_ID: auth.userPoolId,
      REACT_APP_IDENTITY_POOL_ID: auth.cognitoIdentityPoolId,
      REACT_APP_USER_POOL_CLIENT_ID: auth.userPoolClientId
    }
  });
  stack.addOutputs({
    SiteUrl: site.customDomainUrl || site.url || "http://localhost:3000"
  });
}
__name(FrontendStack, "FrontendStack");

// stacks/ScriptStack.js
import { dependsOn, Script, use as use3 } from "sst/constructs";
function AfterDeployStack({ stack }) {
  const { tenantTable } = use3(StorageStack);
  const { auth, cognitoAccessPolicy } = use3(AuthAndApiStack);
  dependsOn(AuthAndApiStack);
  dependsOn(StorageStack);
  new Script(stack, "TopLevelTenant", {
    onCreate: {
      handler: "services/functions/script/topleveltenant.handler",
      environment: { TENANT_TABLE: tenantTable.tableName },
      permissions: [tenantTable]
    }
  });
  new Script(stack, "TopLevelAdmin", {
    onCreate: {
      handler: "services/functions/script/topleveladmin.handler",
      environment: {
        USER_POOL_ID: auth.userPoolId,
        ADMIN_USERNAME: process.env.ADMIN_USERNAME
      },
      permissions: [cognitoAccessPolicy]
    }
  });
}
__name(AfterDeployStack, "AfterDeployStack");

// sst.config.ts
var sst_config_default = {
  config(input) {
    return {
      name: "supplix",
      region: "ap-southeast-2"
    };
  },
  stacks(app) {
    app.setDefaultFunctionProps({
      runtime: "nodejs16.x",
      architecture: "arm_64"
    });
    app.stack(StorageStack).stack(AuthAndApiStack).stack(FrontendStack).stack(AfterDeployStack);
  }
};
export {
  sst_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL0F1dGhBbmRBcGlTdGFjay5qcyIsICJzdGFja3MvU3RvcmFnZVN0YWNrLmpzIiwgInNlcnZpY2VzL3V0aWwvY29uc3RhbnRzLmpzIiwgInN0YWNrcy9Gcm9udGVuZFN0YWNrLmpzIiwgInN0YWNrcy9TY3JpcHRTdGFjay5qcyIsICJzc3QuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIjtcclxuXHJcbmltcG9ydCB7IENvZ25pdG8sIEFwaSwgdXNlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gXCIuL1N0b3JhZ2VTdGFja1wiO1xyXG5pbXBvcnQgeyBBRE1JTl9HUk9VUCwgVE9QX0xFVkVMX0FETUlOX0dST1VQLCBXT1JLU1BBQ0VfT1dORVJfUk9MRSB9IGZyb20gXCIuLi9zZXJ2aWNlcy91dGlsL2NvbnN0YW50c1wiO1xyXG5pbXBvcnQgeyBTdHJpbmdBdHRyaWJ1dGUgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIjtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gQXV0aEFuZEFwaVN0YWNrKHsgc3RhY2ssIGFwcCB9KSB7XHJcbiAgY29uc3Qge1xyXG4gICAgYnVja2V0LFxyXG4gICAgdGVtcGxhdGVUYWJsZSxcclxuICAgIHRlbmFudFRhYmxlLFxyXG4gICAgdXNlclRhYmxlLFxyXG4gICAgaXNvVGFibGUsXHJcbiAgICBmb3JtVGFibGUsXHJcbiAgICBkb2NUYWJsZSxcclxuICAgIHdvcmtzcGFjZVRhYmxlLFxyXG4gICAgd29ya3NwYWNlVXNlclRhYmxlLFxyXG4gICAgd29ya3NwYWNlVGFza1RhYmxlLFxyXG4gICAgZGVsZXRlZEFyY2hpdmVUYWJsZSxcclxuICB9ID0gdXNlKFN0b3JhZ2VTdGFjayk7XHJcblxyXG4gIC8vIENyZWF0ZSBhIENvZ25pdG8gVXNlciBQb29sIGFuZCBJZGVudGl0eSBQb29sXHJcbiAgY29uc3QgdGVuYW50QXR0cmlidXRlID0gbmV3IFN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICBuYW1lOiAnY3VzdG9tOnRlbmFudCcsXHJcbiAgICBtdXRhYmxlOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgYXV0aCA9IG5ldyBDb2duaXRvKHN0YWNrLCBcIkF1dGhcIiwge1xyXG4gICAgbG9naW46IFtcImVtYWlsXCJdLFxyXG4gICAgY2RrOiB7XHJcbiAgICAgIHVzZXJQb29sOiB7XHJcbiAgICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xyXG4gICAgICAgICAgdGVuYW50OiB0ZW5hbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgZW1haWxTZXR0aW5nczoge1xyXG4gICAgICAgIGZyb21FbWFpbDogXCJub3JlcGx5QGlzb2Nsb3VkLmNvbS5hdVwiLCAvLyBDdXN0b21pemUgdGhlIFwiZnJvbVwiIGVtYWlsIGFkZHJlc3NcclxuICAgICAgICByZXBseVRvRW1haWw6IFwibm9yZXBseUBpc29jbG91ZC5jb20uYXVcIiwgLy8gQ3VzdG9taXplIHRoZSByZXBseS10byBlbWFpbCBhZGRyZXNzXHJcbiAgICAgICAgZW1haWxTdWJqZWN0OiBcIldlbGNvbWUgdG8gSVNPIENsb3VkXCIsIC8vIEN1c3RvbWl6ZSB0aGUgc3ViamVjdCBvZiB0aGUgZW1haWxcclxuICAgICAgICB2ZXJpZmljYXRpb25NZXNzYWdlOiBcIllvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9XCIsIC8vIEN1c3RvbWl6ZSB0aGUgdmVyaWZpY2F0aW9uIG1lc3NhZ2VcclxuICAgICAgICB3ZWxjb21lTWVzc2FnZTogXCJXZWxjb21lIHRvIElTTyBDbG91ZCEgWW91ciB1c2VybmFtZSBpcyB7dXNlcm5hbWV9XCIsIC8vIEN1c3RvbWl6ZSB0aGUgd2VsY29tZSBtZXNzYWdlXHJcbiAgICAgICAgcGFzc3dvcmRSZXNldE1lc3NhZ2U6IFwiWW91ciBwYXNzd29yZCByZXNldCBjb2RlIGlzIHsjIyMjfVwiLCAvLyBDdXN0b21pemUgdGhlIHBhc3N3b3JkIHJlc2V0IG1lc3NhZ2VcclxuICAgICAgfSxcclxuICAgICAgXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBcclxuXHJcbiAgY29uc3QgdG9wTGV2ZWxBZG1pbnNHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAoXHJcbiAgICBzdGFjaywgLy8gdGhpc1xyXG4gICAgXCJUb3BMZXZlbEFkbWluc1wiLFxyXG4gICAge1xyXG4gICAgICBncm91cE5hbWU6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgdXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgfVxyXG4gICk7ICBcclxuICBjb25zdCBhZG1pbnNHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAoXHJcbiAgICBzdGFjaywgLy8gdGhpc1xyXG4gICAgXCJBZG1pbnNcIixcclxuICAgIHtcclxuICAgICAgZ3JvdXBOYW1lOiBBRE1JTl9HUk9VUCxcclxuICAgICAgdXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgfVxyXG4gICk7XHJcblxyXG5cclxuXHJcbiAgY29uc3QgYWRtaW5Vc2VybmFtZSA9IHByb2Nlc3MuZW52LkFETUlOX1VTRVJOQU1FO1xyXG5cclxuICBjb25zdCBhZG1pblVzZXIgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbFVzZXIoc3RhY2ssIFwiQWRtaW5Vc2VyXCIsIHtcclxuICAgIHVzZXJQb29sSWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgIHVzZXJuYW1lOiBhZG1pblVzZXJuYW1lLFxyXG4gICAgZGVzaXJlZERlbGl2ZXJ5TWVkaXVtczogW1wiRU1BSUxcIl0sIFxyXG4gICAgZm9yY2VBbGlhc0NyZWF0aW9uOiB0cnVlLFxyXG4gICAgdXNlckF0dHJpYnV0ZXM6IFtcclxuICAgICAgeyBuYW1lOiBcImVtYWlsXCIsIHZhbHVlOiBwcm9jZXNzLmVudi5BRE1JTl9FTUFJTCB9LFxyXG4gICAgICB7IG5hbWU6IFwiY3VzdG9tOnRlbmFudFwiLCB2YWx1ZTogXCJpc29jbG91ZFwiIH0sXHJcbiAgICBdLFxyXG5cclxuICB9KTtcclxuXHJcblxyXG5cclxuICBjb25zdCBjb2duaXRvQWNjZXNzUG9saWN5ID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgYWN0aW9uczogW1wiY29nbml0by1pZHA6KlwiXSxcclxuICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgIHJlc291cmNlczogW1xyXG4gICAgICBgYXJuOmF3czpjb2duaXRvLWlkcDoke2FwcC5yZWdpb259OiR7YXBwLmFjY291bnR9OnVzZXJwb29sLyR7YXV0aC51c2VyUG9vbElkfWAsXHJcbiAgICBdLFxyXG4gIH0pO1xyXG5cclxuICAgIGNvbnN0IGNvZ25pdG9SZWFkb25seUFjY2Vzc1BvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgIGFjdGlvbnM6IFtcImNvZ25pdG8taWRwOkRlc2NyaWJlKlwiLCBcImNvZ25pdG8taWRwOkFkbWluR2V0VXNlclwiXSxcclxuICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgIHJlc291cmNlczogW1xyXG4gICAgICBgYXJuOmF3czpjb2duaXRvLWlkcDoke2FwcC5yZWdpb259OiR7YXBwLmFjY291bnR9OnVzZXJwb29sLyR7YXV0aC51c2VyUG9vbElkfWAsXHJcbiAgICBdLFxyXG4gIH0pO1xyXG4gIC8vIENyZWF0ZSB0aGUgQVBJXHJcbiAgY29uc3QgYXBpID0gbmV3IEFwaShzdGFjaywgXCJBcGlcIiwge1xyXG4gICAgY29yczogdHJ1ZSxcclxuICAgIGF1dGhvcml6ZXJzOiB7XHJcbiAgICAgIGp3dDoge1xyXG4gICAgICAgIHR5cGU6IFwidXNlcl9wb29sXCIsXHJcbiAgICAgICAgdXNlclBvb2w6IHtcclxuICAgICAgICAgIGlkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICBjbGllbnRJZHM6IFthdXRoLnVzZXJQb29sQ2xpZW50SWRdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgLy8gY3VzdG9tRG9tYWluOiBhcHAuc3RhZ2UgPT09IFwicHJvZFwiID8gYGFwaS4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gIDogYXBwLnN0YWdlID09PSBcInN0Z1wiID8gYGFwaS5zdGcuJHtwcm9jZXNzLmVudi5ET01BSU59YCA6IHVuZGVmaW5lZCxcclxuICAgIGN1c3RvbURvbWFpbjpcclxuICAgICAgYXBwLnN0YWdlID09PSBcInByb2RcIiA/IGBhcGkuJHtwcm9jZXNzLmVudi5ET01BSU59YCA6IHVuZGVmaW5lZCxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgIGF1dGhvcml6ZXI6IFwiand0XCIsXHJcbiAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgIFRFTVBMQVRFX1RBQkxFOiB0ZW1wbGF0ZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIFRFTkFOVF9UQUJMRTogdGVuYW50VGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgVVNFUl9UQUJMRTogdXNlclRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIElTT19UQUJMRTogaXNvVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgRk9STV9UQUJMRTogZm9ybVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIERPQ19UQUJMRTogZG9jVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgV09SS1NQQUNFX1RBQkxFOiB3b3Jrc3BhY2VUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBXT1JLU1BBQ0VVU0VSX1RBQkxFOiB3b3Jrc3BhY2VVc2VyVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgV09SS1NQQUNFVEFTS19UQUJMRTogd29ya3NwYWNlVGFza1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIERFTEVURURBUkNISVZFX1RBQkxFOiBkZWxldGVkQXJjaGl2ZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIEJVQ0tFVDogYnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXJtaXNzaW9uczogW3dvcmtzcGFjZVVzZXJUYWJsZV0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcm91dGVzOiB7XHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2UvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZS9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgICAvd29ya3NwYWNlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2UvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYWJsZSwgZGVsZXRlZEFyY2hpdmVUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL215d29ya3NwYWNlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZW1lbWJlci9nZXRteXdvcmtzcGFjZXMubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vbWVtYmVyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZW1lbWJlci9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VVc2VyVGFibGUsIHdvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vbWVtYmVyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZW1lbWJlci9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVVzZXJUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBXT1JLU1BBQ0VfQUxMT1dFRF9ST0xFOiBXT1JLU1BBQ0VfT1dORVJfUk9MRSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9tZW1iZXJzL3t1c2VySWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlbWVtYmVyL2RlbGV0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVXNlclRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFdPUktTUEFDRV9BTExPV0VEX1JPTEU6IFdPUktTUEFDRV9PV05FUl9ST0xFLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvbXl0YXNrc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZXRhc2svZ2V0bXl0YXNrcy5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFza1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vdGFza3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhc2tUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3Rhc2tzL3t0YXNrSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNldGFzay9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhc2tUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3Rhc2tzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNldGFzay9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhc2tUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSwgICAgICBcclxuICAgICAgXCJQVVQgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vdGFza3Mve3Rhc2tJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFza1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3Rhc2tzL3t0YXNrSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNldGFzay9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVVzZXJUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBXT1JLU1BBQ0VfQUxMT1dFRF9ST0xFOiBXT1JLU1BBQ0VfT1dORVJfUk9MRSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcblxyXG5cclxuXHJcbiAgICAgIFwiUE9TVCAvZG9jcy91cGxvYWQtdXJsXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2dldFVybEZvclB1dC5tYWluXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9kb2NzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlLCB3b3Jrc3BhY2VUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9kb2NzL3tkb2NJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtkb2NUYWJsZSwgd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2RvY3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtkb2NUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9kb2NzL3tkb2NJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtkb2NUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBXT1JLU1BBQ0VfQUxMT1dFRF9ST0xFOiBXT1JLU1BBQ0VfT1dORVJfUk9MRSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZm9ybXMve2Zvcm1JZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9mb3JtL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZSwgZm9ybVRhYmxlLCB3b3Jrc3BhY2VUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtcy97Zm9ybUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b1JlYWRvbmx5QWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGJpbmQ6IFtmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZm9ybXMve2Zvcm1JZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9mb3JtL2RlbGV0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbZm9ybVRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFdPUktTUEFDRV9BTExPV0VEX1JPTEU6IFdPUktTUEFDRV9PV05FUl9ST0xFLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvdGVtcGxhdGVzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgLy8gdGVtcGxhdGVzIGFyZSBub3Qgd29ya3NwYWNlIGF3YXJlIGJ1dCBmb3JtcyBhcmUuXHJcbiAgICAgIC8vIFRoaXMgZW5kcG9pbnQgcmV0dXJucyBmb3JtIGNvdW50IGZvciB0aGUgdGVtcGxhdGVzIHNvIGl0IG5lZWRzIHRvIGJlIHdvcmtzcGFjZSBhd2FyZS5cclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3RlbXBsYXRlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbXBsYXRlL2xpc3RXaXRoRm9ybUNvdW50Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlLCBmb3JtVGFibGUsIHdvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlLCBmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgIC90ZW1wbGF0ZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3RlbXBsYXRlcy97dGVtcGxhdGVJZH0vZm9ybXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9saXN0Rm9ybXMubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZSwgd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIGlzb1xyXG4gICAgICBcIkdFVCAgIC9pc29zL3RvcC1sZXZlbFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2lzby9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2lzb1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIHByb2Nlc3NcclxuICAgICAgXCJQVVQgICAvaXNvcy90b3AtbGV2ZWxcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9pc28vdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtpc29UYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG5cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvdGVuYW50c1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC90ZW5hbnRzL3t0ZW5hbnRJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgICAvdGVuYW50c1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUICAgL3RlbmFudHMve3RlbmFudElkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFICAgL3RlbmFudHMve3RlbmFudElkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBcIkdFVCAgIC9teXRlbmFudFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9nZXRteXRlbmFudC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHt9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC9teXVzZXJcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdXNlclRhYmxlXSxcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdXNlclRhYmxlXSxcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgLy8gd29ya3NwYWNlIG93bmVycyBjYW4gc2VlIHRoZSBsaXN0IG9mIHVzZXJzIHRvIGFkZC9yZW1vdmUgdGhlbSB0by9mcm9tIHdvcmtzcGFjZVxyXG4gICAgICAgICAgICAvLyBzbyBBTExPV0VEX0dST1VQUyBpcyBub3Qgc2V0XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC90ZW5hbnRzL3t0ZW5hbnRJZH0vdXNlcnNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAvdXNlcnNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdXNlclRhYmxlXSxcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgL3RlbmFudHMve3RlbmFudElkfS91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAvdXNlcnMve3VzZXJuYW1lfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUIC90ZW5hbnRzL3t0ZW5hbnRJZH0vdXNlcnMve3VzZXJuYW1lfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAvdXNlcnMve3VzZXJuYW1lfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC90ZW5hbnRzL3t0ZW5hbnRJZH0vdXNlcnMve3VzZXJuYW1lfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcblxyXG5cclxuXHJcblxyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJQT1NUIC9kb2NzL3VwbG9hZC11cmxcIiwgW1wiczNcIlxyXG4gICAgLy8gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgLy8gICBhY3Rpb25zOiBbXCJzMzoqXCJdLFxyXG4gICAgLy8gICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAvLyAgIHJlc291cmNlczogW1xyXG4gICAgLy8gICAgIGJ1Y2tldC5idWNrZXRBcm4sXHJcbiAgICAvLyAgICAgYnVja2V0LmJ1Y2tldEFybiArIFwiLypcIixcclxuICAgIC8vICAgICAvLyBidWNrZXQuYnVja2V0QXJuICsgXCIvcHJpdmF0ZS8ke2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTpjdXN0b206dGVuYW50fS8qXCIsXHJcbiAgICAvLyAgIF0sXHJcbiAgICAvLyB9KSxcclxuICBdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZG9jcy97ZG9jSWR9XCIsIFtcInMzXCJdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZm9ybXMve2Zvcm1JZH1cIiwgW1wiczNcIl0pO1xyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJQVVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtcy97Zm9ybUlkfVwiLCBbXCJzM1wiXSk7XHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIkdFVCAvdXNlcnMve3VzZXJuYW1lfVwiLCBbXCJzM1wiXSk7XHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIkdFVCAvdXNlcnNcIiwgW1wiczNcIl0pO1xyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJHRVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vyc1wiLCBbXCJzM1wiXSk7XHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIkdFVCAvbXl1c2VyXCIsIFtcInMzXCJdKTtcclxuICBcclxuICB3b3Jrc3BhY2VUYXNrVGFibGUuYWRkQ29uc3VtZXJzKHN0YWNrLCB7XHJcbiAgICBub3RpZnk6IHtcclxuICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNldGFzay9ub3RpZnkubWFpblwiLFxyXG4gICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9SZWFkb25seUFjY2Vzc1BvbGljeV0sXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIGJpbmQ6IFt0YWJsZV0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICB3b3Jrc3BhY2VUYXNrVGFibGUuYXR0YWNoUGVybWlzc2lvbnNUb0NvbnN1bWVyKFwibm90aWZ5XCIsIFtcInNlc1wiXSk7XHJcbiAgXHJcbiAgYXV0aC5hdHRhY2hQZXJtaXNzaW9uc0ZvckF1dGhVc2VycyhhdXRoLCBbXHJcbiAgICAvLyBBbGxvdyBhY2Nlc3MgdG8gdGhlIEFQSVxyXG4gICAgYXBpLFxyXG5cclxuICAgICAvLyBQb2xpY3kgZ3JhbnRpbmcgYWNjZXNzIHRvIGEgc3BlY2lmaWMgZm9sZGVyIGluIHRoZSBidWNrZXRcclxuICAgICAvLyB0aGlzIGlzIG5vbiBzZW5zaXRpdmUgZmlsZXMgc3VjaCBhcyBsb2dvc1xyXG4gICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgYWN0aW9uczogW1wiczM6KlwiXSxcclxuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICBidWNrZXQuYnVja2V0QXJuICsgXCIvcHVibGljLypcIixcclxuICAgICAgXSxcclxuICAgIH0pLFxyXG4gIF0pO1xyXG4gIFxyXG4gXHJcbiBcclxuICBcclxuICBcclxuXHJcbiAgXHJcblxyXG5cclxuICAvLyBTaG93IHRoZSBhdXRoIHJlc291cmNlcyBpbiB0aGUgb3V0cHV0XHJcbiAgc3RhY2suYWRkT3V0cHV0cyh7XHJcbiAgICBBY2NvdW50OiBhcHAuYWNjb3VudCxcclxuICAgIFJlZ2lvbjogYXBwLnJlZ2lvbixcclxuICAgIFVzZXJQb29sSWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgIElkZW50aXR5UG9vbElkOiBhdXRoLmNvZ25pdG9JZGVudGl0eVBvb2xJZCxcclxuICAgIFVzZXJQb29sQ2xpZW50SWQ6IGF1dGgudXNlclBvb2xDbGllbnRJZCxcclxuICAgIEFwaUVuZHBvaW50OiBhcGkuY3VzdG9tRG9tYWluVXJsIHx8IGFwaS51cmwsXHJcbiAgfSk7XHJcbiAgLy8gUmV0dXJuIHRoZSBhdXRoIHJlc291cmNlXHJcbiAgcmV0dXJuIHtcclxuICAgIGF1dGgsXHJcbiAgICBhcGksXHJcbiAgICBjb2duaXRvQWNjZXNzUG9saWN5XHJcbiAgfTtcclxufVxyXG4iLCAiaW1wb3J0IHsgQXR0cmlidXRlVHlwZSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGJcIjtcclxuaW1wb3J0IHsgQnVja2V0LCBUYWJsZSB9IGZyb20gXCJzc3QvY29uc3RydWN0c1wiO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBTdG9yYWdlU3RhY2soeyBzdGFjaywgYXBwIH0pIHtcclxuICAvLyBDcmVhdGUgYW4gUzMgYnVja2V0XHJcblxyXG4gIGNvbnN0IGJ1Y2tldCA9IG5ldyBCdWNrZXQoc3RhY2ssIFwiVXBsb2Fkc1wiICwge1xyXG4gICAgY29yczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgbWF4QWdlOiBcIjEgZGF5XCIsXHJcbiAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFtcIipcIl0sXHJcbiAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFtcIipcIl0sXHJcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtcIkdFVFwiLCBcIlBVVFwiLCBcIlBPU1RcIiwgXCJERUxFVEVcIiwgXCJIRUFEXCJdLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxuXHJcblxyXG5cclxuICBjb25zdCB0ZW5hbnRUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJUZW5hbnRcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudElkOiBcInN0cmluZ1wiLFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50SWRcIiB9LFxyXG5cclxuICB9KTtcclxuICBcclxuICBjb25zdCB1c2VyVGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFwiVXNlclwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICBVc2VybmFtZTogXCJzdHJpbmdcIixcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcIlVzZXJuYW1lXCIgfSxcclxuXHJcbiAgfSk7XHJcbiAgXHJcbiAgY29uc3Qgd29ya3NwYWNlVGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFwiV29ya3NwYWNlXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHdvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICBuYW1lOiBcInN0cmluZ1wiLFxyXG4gICAgICBwYXJlbnRJZDogXCJzdHJpbmdcIlxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwid29ya3NwYWNlSWRcIiB9LFxyXG4gICAgLy8gZ2xvYmFsSW5kZXhlczogW1xyXG4gICAgLy8gICB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJwYXJlbnRJZFwifVxyXG4gICAgLy8gXVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgY29uc3QgZGVsZXRlZEFyY2hpdmVUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJEZWxldGVkQXJjaGl2ZVwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICBkZWxldGVkQXQ6IFwibnVtYmVyXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJkZWxldGVkQXRcIiB9LFxyXG4gIH0pO1xyXG5cclxuXHJcbiAgY29uc3Qgd29ya3NwYWNlVGFza1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrLCBcIldvcmtzcGFjZVRhc2tcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHRlbmFudF93b3Jrc3BhY2VJZDogXCJzdHJpbmdcIixcclxuICAgICAgdGFza0lkOiBcInN0cmluZ1wiLFxyXG4gICAgICB1c2VySWQ6IFwic3RyaW5nXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRfd29ya3NwYWNlSWRcIiwgc29ydEtleTogXCJ0YXNrSWRcIiB9LFxyXG4gICAgZ2xvYmFsSW5kZXhlczoge1xyXG4gICAgICB1c2VySW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcInVzZXJJZFwiIH0sXHJcbiAgICB9LFxyXG4gICAgc3RyZWFtOiBcIm5ld19hbmRfb2xkX2ltYWdlc1wiLFxyXG4gIH0pO1xyXG4gICBcclxuICBjb25zdCB3b3Jrc3BhY2VVc2VyVGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFwiV29ya3NwYWNlVXNlclwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICB3b3Jrc3BhY2VJZDogXCJzdHJpbmdcIixcclxuICAgICAgdGVuYW50X3dvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB1c2VySWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgICByb2xlOiBcInN0cmluZ1wiLCAvLyBvd25lciBvciBtZW1iZXJcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudF93b3Jrc3BhY2VJZFwiLCBzb3J0S2V5OiBcInVzZXJJZFwiIH0sIFxyXG4gIH0pXHJcbiBcclxuICBjb25zdCBpc29UYWJsZSA9IG5ldyBUYWJsZShzdGFjayAsIFwiSXNvXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIGlzb0lkOiBcInN0cmluZ1wiLCAvLyB1bmlxdWUgaWQgb2YgdGhpcyBjdXN0b21pc2VkIHRlbXBsYXRlXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJpc29JZFwiIH0sIFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBmb3JtVGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFwiRm9ybVwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICB3b3Jrc3BhY2VJZDogXCJzdHJpbmdcIixcclxuICAgICAgdGVuYW50X3dvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICBmb3JtSWQ6IFwic3RyaW5nXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRfd29ya3NwYWNlSWRcIiwgc29ydEtleTogXCJmb3JtSWRcIiB9LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCB0ZW1wbGF0ZVRhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJUZW1wbGF0ZVwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICB0ZW1wbGF0ZUlkOiBcInN0cmluZ1wiLCBcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcInRlbXBsYXRlSWRcIiB9LFxyXG4gIH0pO1xyXG5cclxuXHJcbiAgY29uc3QgZG9jVGFibGUgPSBuZXcgVGFibGUoc3RhY2sgLCBcIkRvY1wiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICB3b3Jrc3BhY2VJZDogXCJzdHJpbmdcIixcclxuICAgICAgdGVuYW50X3dvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICBkb2NJZDogXCJzdHJpbmdcIiwgXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRfd29ya3NwYWNlSWRcIiwgc29ydEtleTogXCJkb2NJZFwiIH0sXHJcbiAgfSk7XHJcblxyXG5cclxuICBcclxuICByZXR1cm4geyBcclxuICAgIHRlbmFudFRhYmxlLFxyXG4gICAgdXNlclRhYmxlLFxyXG4gICAgaXNvVGFibGUsXHJcbiAgICB0ZW1wbGF0ZVRhYmxlLFxyXG4gICAgZm9ybVRhYmxlLFxyXG4gICAgZG9jVGFibGUsXHJcbiAgICB3b3Jrc3BhY2VUYWJsZSxcclxuICAgIHdvcmtzcGFjZVVzZXJUYWJsZSxcclxuICAgIHdvcmtzcGFjZVRhc2tUYWJsZSxcclxuICAgIGRlbGV0ZWRBcmNoaXZlVGFibGUsXHJcbiAgICBidWNrZXQsXHJcbiAgfTtcclxufSIsICJleHBvcnQgY29uc3QgVE9QX0xFVkVMX0FETUlOX0dST1VQID0gJ3RvcC1sZXZlbC1hZG1pbnMnO1xyXG5leHBvcnQgY29uc3QgQURNSU5fR1JPVVAgPSAnYWRtaW5zJztcclxuZXhwb3J0IGNvbnN0IFdPUktTUEFDRV9PV05FUl9ST0xFID0gJ093bmVyJztcclxuZXhwb3J0IGNvbnN0IFdPUktTUEFDRV9NRU1CRVJfUk9MRSA9ICdNZW1iZXInO1xyXG5leHBvcnQgY29uc3QgTkNSX1dPUktTQVBDRV9JRCA9ICdOQ1InO1xyXG4iLCAiaW1wb3J0IHsgU3RhdGljU2l0ZSwgdXNlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcblxyXG5pbXBvcnQgeyBBdXRoQW5kQXBpU3RhY2sgfSBmcm9tIFwiLi9BdXRoQW5kQXBpU3RhY2tcIjtcclxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vU3RvcmFnZVN0YWNrXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRnJvbnRlbmRTdGFjayh7IHN0YWNrLCBhcHAgfSkge1xyXG4gIGNvbnN0IHsgYXBpLCBhdXRoIH0gPSB1c2UoQXV0aEFuZEFwaVN0YWNrKTtcclxuICBjb25zdCB7IGJ1Y2tldCB9ID0gdXNlKFN0b3JhZ2VTdGFjayk7XHJcbiAgLy8gRGVmaW5lIG91ciBSZWFjdCBhcHBcclxuICBjb25zdCBzaXRlID0gbmV3IFN0YXRpY1NpdGUoc3RhY2ssIFwiUmVhY3RTaXRlXCIsIHtcclxuICAgIGN1c3RvbURvbWFpbjpcclxuICAgICAgYXBwLnN0YWdlID09PSBcInByb2RcIlxyXG4gICAgICAgID8ge1xyXG4gICAgICAgICAgICBkb21haW5OYW1lOiBgJHtwcm9jZXNzLmVudi5ET01BSU59YCxcclxuICAgICAgICAgICAgZG9tYWluQWxpYXM6IGB3d3cuJHtwcm9jZXNzLmVudi5ET01BSU59YCxcclxuICAgICAgICAgIH1cclxuICAgICAgICAvLyA6IFxyXG4gICAgICAgIC8vIGFwcC5zdGFnZSA9PT0gXCJzdGdcIlxyXG4gICAgICAgIC8vID8ge1xyXG4gICAgICAgIC8vICAgZG9tYWluTmFtZTogYHN0Zy4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgIC8vIH1cclxuICAgICAgICA6IFxyXG4gICAgICAgIHVuZGVmaW5lZCxcclxuXHJcbiAgICBwYXRoOiBcImZyb250ZW5kXCIsXHJcbiAgICBidWlsZENvbW1hbmQ6IFwibnBtIHJ1biBidWlsZFwiLCAvLyBvciBcInlhcm4gYnVpbGRcIlxyXG4gICAgYnVpbGRPdXRwdXQ6IFwiYnVpbGRcIixcclxuICAgIC8vIFBhc3MgaW4gb3VyIGVudmlyb25tZW50IHZhcmlhYmxlc1xyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgUkVBQ1RfQVBQX0FQSV9VUkw6IGFwaS5jdXN0b21Eb21haW5VcmwgfHwgYXBpLnVybCxcclxuICAgICAgUkVBQ1RfQVBQX1JFR0lPTjogYXBwLnJlZ2lvbixcclxuICAgICAgUkVBQ1RfQVBQX0JVQ0tFVDogYnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgIFJFQUNUX0FQUF9VU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgUkVBQ1RfQVBQX0lERU5USVRZX1BPT0xfSUQ6IGF1dGguY29nbml0b0lkZW50aXR5UG9vbElkLFxyXG4gICAgICBSRUFDVF9BUFBfVVNFUl9QT09MX0NMSUVOVF9JRDogYXV0aC51c2VyUG9vbENsaWVudElkLFxyXG4gICAgfSxcclxuICB9KTtcclxuICAvLyBTaG93IHRoZSB1cmwgaW4gdGhlIG91dHB1dFxyXG4gIHN0YWNrLmFkZE91dHB1dHMoe1xyXG4gICAgU2l0ZVVybDogc2l0ZS5jdXN0b21Eb21haW5VcmwgfHwgc2l0ZS51cmwgfHwgXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcclxuICB9KTtcclxufVxyXG4iLCAiaW1wb3J0IHsgZGVwZW5kc09uLCBTY3JpcHQsIHVzZSB9IGZyb20gXCJzc3QvY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBBdXRoQW5kQXBpU3RhY2sgfSBmcm9tIFwiLi9BdXRoQW5kQXBpU3RhY2tcIjtcclxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vU3RvcmFnZVN0YWNrXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gQWZ0ZXJEZXBsb3lTdGFjayh7IHN0YWNrIH0pIHtcclxuICBjb25zdCB7IHRlbmFudFRhYmxlIH0gPSB1c2UoU3RvcmFnZVN0YWNrKTtcclxuICBjb25zdCB7IGF1dGgsIGNvZ25pdG9BY2Nlc3NQb2xpY3kgfSA9IHVzZShBdXRoQW5kQXBpU3RhY2spO1xyXG5cclxuICBkZXBlbmRzT24oQXV0aEFuZEFwaVN0YWNrKTtcclxuICBkZXBlbmRzT24oU3RvcmFnZVN0YWNrKTtcclxuICBuZXcgU2NyaXB0KHN0YWNrLCBcIlRvcExldmVsVGVuYW50XCIsIHtcclxuICAgIG9uQ3JlYXRlOiB7XHJcbiAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3NjcmlwdC90b3BsZXZlbHRlbmFudC5oYW5kbGVyXCIsXHJcbiAgICAgIGVudmlyb25tZW50OiB7IFRFTkFOVF9UQUJMRTogdGVuYW50VGFibGUudGFibGVOYW1lIH0sXHJcbiAgICAgIHBlcm1pc3Npb25zOiBbdGVuYW50VGFibGVdLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgbmV3IFNjcmlwdChzdGFjaywgXCJUb3BMZXZlbEFkbWluXCIsIHtcclxuICAgIG9uQ3JlYXRlOiB7XHJcbiAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3NjcmlwdC90b3BsZXZlbGFkbWluLmhhbmRsZXJcIixcclxuICAgICAgZW52aXJvbm1lbnQ6IHsgXHJcbiAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgQURNSU5fVVNFUk5BTUU6IHByb2Nlc3MuZW52LkFETUlOX1VTRVJOQU1FXHJcbiAgICAgfSxcclxuICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG59XHJcbiIsICJcbmltcG9ydCB0eXBlIHsgU1NUQ29uZmlnIH0gZnJvbSBcInNzdFwiXG5pbXBvcnQgeyBBdXRoQW5kQXBpU3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvQXV0aEFuZEFwaVN0YWNrLmpzXCJcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9TdG9yYWdlU3RhY2suanNcIlxuaW1wb3J0IHsgRnJvbnRlbmRTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9Gcm9udGVuZFN0YWNrLmpzXCJcbmltcG9ydCB7IEFmdGVyRGVwbG95U3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvU2NyaXB0U3RhY2suanNcIlxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNvbmZpZyhpbnB1dCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiBcInN1cHBsaXhcIixcbiAgICAgIHJlZ2lvbjogXCJhcC1zb3V0aGVhc3QtMlwiLFxuICAgIH1cbiAgfSxcbiAgc3RhY2tzKGFwcCkge1xuICAgIGFwcC5zZXREZWZhdWx0RnVuY3Rpb25Qcm9wcyh7XG4gICAgICBydW50aW1lOiBcIm5vZGVqczE2LnhcIixcbiAgICAgIGFyY2hpdGVjdHVyZTogXCJhcm1fNjRcIixcbiAgICB9KVxuXG4gICAgYXBwXG4gICAgICAuc3RhY2soU3RvcmFnZVN0YWNrKSAgXG4gICAgICAuc3RhY2soQXV0aEFuZEFwaVN0YWNrKVxuICAgICAgLnN0YWNrKEZyb250ZW5kU3RhY2spXG4gICAgICAuc3RhY2soQWZ0ZXJEZXBsb3lTdGFjaylcbiAgfSxcbn0gc2F0aXNmaWVzIFNTVENvbmZpZyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBQUEsWUFBWSxTQUFTO0FBQ3JCLFlBQVksYUFBYTtBQUV6QixTQUFTLFNBQVMsS0FBSyxXQUFXOzs7QUNIbEMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxRQUFRLGFBQWE7QUFHdkIsU0FBUyxhQUFhLEVBQUUsT0FBTyxJQUFJLEdBQUc7QUFHM0MsUUFB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
