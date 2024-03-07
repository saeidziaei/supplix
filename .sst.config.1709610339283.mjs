import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/AuthAndApiStack.js
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Cognito, Api, use, Function } from "sst/constructs";

// stacks/StorageStack.js
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
    primaryIndex: { partitionKey: "tenant", sortKey: "workspaceId" },
    stream: "new_and_old_images"
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
      userId: "string",
      isRecurring: "string",
      endDate: "number"
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "taskId" },
    globalIndexes: {
      userIndex: { partitionKey: "tenant", sortKey: "userId" },
      isRecurringIndex: { partitionKey: "isRecurring" }
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
      formId: "string",
      userId: "string"
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "formId" },
    globalIndexes: {
      userIndex: { partitionKey: "tenant", sortKey: "userId" }
    },
    stream: "new_and_old_images"
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
  const stripeEventTable = new Table(stack, "StripeEvent", {
    fields: {
      stripeEventId: "string"
    },
    primaryIndex: { partitionKey: "stripeEventId" },
    stream: "new_image"
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
    stripeEventTable,
    bucket
  };
}
__name(StorageStack, "StorageStack");

// services/util/constants.js
var TOP_LEVEL_ADMIN_GROUP = "top-level-admins";
var ADMIN_GROUP = "admins";
var WORKSPACE_OWNER_ROLE = "Owner";
var RECURRING = "RECURRING";

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
    deletedArchiveTable,
    stripeEventTable
  } = use(StorageStack);
  const tenantAttribute = new StringAttribute({
    name: "custom:tenant",
    mutable: false
  });
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
    cdk: {
      userPool: {
        selfSignUpEnabled: false,
        deletionProtection: true,
        customAttributes: {
          tenant: tenantAttribute
        },
        userInvitation: {
          emailSubject: "Welcome to ISOCloud",
          emailBody: `<h2>Welcome to ISO Cloud!</h2>
          <p>
          Your login details are as follows:<br/><br/>
Username: {username}<br/>
Temporary Password: {####}
</p>          
          <p>Please use the provided information to access your account here: <a href='https://app.isocloud.com.au/'>ISO Cloud</a></p>
          <br/><br/>
          <i>https://app.isocloud.com.au/</i>`
        }
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
      throttle: {
        rate: 2e3,
        burst: 100
      },
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
          STRIPEEVENT_TABLE: stripeEventTable.tableName,
          BUCKET: bucket.bucketName
        },
        permissions: [workspaceUserTable]
      }
    },
    routes: {
      "POST   /stripe-webhook": {
        function: {
          handler: "services/functions/stripe/webhook.main",
          bind: [stripeEventTable],
          environment: {
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
            ENDPOINT_SECRET: process.env.ENDPOINT_SECRET
          }
        },
        authorizer: "none"
      },
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
          bind: [workspaceTable, workspaceTaskTable],
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
          handler: "services/functions/workspacetask/getusertasks.main",
          bind: [workspaceTaskTable]
        }
      },
      "GET   /users/{username}/tasks": {
        function: {
          handler: "services/functions/workspacetask/getusertasks.main",
          bind: [workspaceTaskTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP
          }
        }
      },
      "GET   /workspaces/{workspaceId}/tasks": {
        function: {
          handler: "services/functions/workspacetask/list.main",
          bind: [workspaceTaskTable, workspaceTable]
        }
      },
      "GET   /workspaces/{workspaceId}/tasks/{taskId}": {
        function: {
          handler: "services/functions/workspacetask/get.main",
          bind: [workspaceTaskTable, workspaceTable]
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
      "POST  /workspaces/{workspaceId}/recurring-tasks": {
        function: {
          handler: "services/functions/workspacetask/create.main",
          bind: [workspaceTaskTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE,
            TASK_MODE: RECURRING
          }
        }
      },
      "PUT  /workspaces/{workspaceId}/recurring-tasks/{taskId}": {
        function: {
          handler: "services/functions/workspacetask/update.main",
          bind: [workspaceTaskTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE,
            TASK_MODE: RECURRING
          }
        }
      },
      "DELETE /workspaces/{workspaceId}/tasks/{taskId}": {
        function: {
          handler: "services/functions/workspacetask/delete.main",
          bind: [workspaceTaskTable],
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
      "PUT /workspaces/{workspaceId}/docs/{docId}": {
        function: {
          handler: "services/functions/doc/update.main",
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
      "DELETE   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/delete.main",
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
      },
      "GET /users/forms/{username}": {
        function: {
          handler: "services/functions/user/getuserforms.main",
          bind: [formTable],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
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
        USER_POOL_ID: auth.userPoolId,
        STAGE: stack.stage
      }
    }
  });
  workspaceTaskTable.attachPermissionsToConsumer("notify", ["ses"]);
  workspaceTable.addConsumers(stack, {
    archiver: {
      handler: "services/functions/workspace/archiver.main",
      environment: {
        DELETEDARCHIVE_TABLE: deletedArchiveTable.tableName
      },
      bind: [deletedArchiveTable]
    }
  });
  formTable.addConsumers(stack, {
    taskForAssignee: {
      handler: "services/functions/form/createTaskForAssignee.main",
      environment: {
        WORKSPACETASK_TABLE: workspaceTaskTable.tableName,
        TEMPLATE_TABLE: templateTable.tableName
      },
      bind: [workspaceTaskTable, templateTable]
    }
  });
  stripeEventTable.addConsumers(stack, {
    fullfilorder: {
      handler: "services/functions/stripe/fullfilorder.main",
      permissions: [cognitoAccessPolicy],
      environment: {
        STRIPEEVENT_TABLE: stripeEventTable.tableName,
        TENANT_TABLE: tenantTable.tableName,
        USER_TABLE: userTable.tableName,
        USER_POOL_ID: auth.userPoolId,
        BASIC_PLAN_PRICE_ID: process.env.BASIC_PLAN_PRICE_ID,
        RED_PLAN_PRICE_ID: process.env.RED_PLAN_PRICE_ID
      },
      bind: [stripeEventTable, tenantTable, userTable]
    }
  });
  stripeEventTable.attachPermissionsToConsumer("fullfilorder", ["ses"]);
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
  const { tenantTable, formTable } = use3(StorageStack);
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
  new Script(stack, "FormsWithoutUser", {
    onCreate: {
      handler: "services/functions/script/setemptyuser.handler",
      environment: { FORM_TABLE: formTable.tableName },
      permissions: [formTable]
    }
  });
}
__name(AfterDeployStack, "AfterDeployStack");

// stacks/CronStack.js
import { Cron, use as use4 } from "sst/constructs";
function CronStack({ stack, app }) {
  const { workspaceTaskTable } = use4(StorageStack);
  new Cron(stack, "cron", {
    schedule: "rate(1 day)",
    job: {
      function: {
        handler: "services/functions/cron/task-generator.main",
        bind: [workspaceTaskTable],
        environment: {
          WORKSPACETASK_TABLE: workspaceTaskTable.tableName
        }
      }
    }
  });
}
__name(CronStack, "CronStack");

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
    app.stack(StorageStack).stack(CronStack).stack(AuthAndApiStack).stack(FrontendStack).stack(AfterDeployStack);
  }
};
export {
  sst_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL0F1dGhBbmRBcGlTdGFjay5qcyIsICJzdGFja3MvU3RvcmFnZVN0YWNrLmpzIiwgInNlcnZpY2VzL3V0aWwvY29uc3RhbnRzLmpzIiwgInN0YWNrcy9Gcm9udGVuZFN0YWNrLmpzIiwgInN0YWNrcy9TY3JpcHRTdGFjay5qcyIsICJzdGFja3MvQ3JvblN0YWNrLmpzIiwgInNzdC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29nbml0b1wiO1xyXG5cclxuaW1wb3J0IHsgQ29nbml0bywgQXBpLCB1c2UsIEZ1bmN0aW9uIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gXCIuL1N0b3JhZ2VTdGFja1wiO1xyXG5pbXBvcnQgeyBBRE1JTl9HUk9VUCwgUkVDVVJSSU5HLCBUT1BfTEVWRUxfQURNSU5fR1JPVVAsIFdPUktTUEFDRV9PV05FUl9ST0xFIH0gZnJvbSBcIi4uL3NlcnZpY2VzL3V0aWwvY29uc3RhbnRzXCI7XHJcbmltcG9ydCB7IFN0cmluZ0F0dHJpYnV0ZSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29nbml0b1wiO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBBdXRoQW5kQXBpU3RhY2soeyBzdGFjaywgYXBwIH0pIHtcclxuICBjb25zdCB7XHJcbiAgICBidWNrZXQsXHJcbiAgICB0ZW1wbGF0ZVRhYmxlLFxyXG4gICAgdGVuYW50VGFibGUsXHJcbiAgICB1c2VyVGFibGUsXHJcbiAgICBpc29UYWJsZSxcclxuICAgIGZvcm1UYWJsZSxcclxuICAgIGRvY1RhYmxlLFxyXG4gICAgd29ya3NwYWNlVGFibGUsXHJcbiAgICB3b3Jrc3BhY2VVc2VyVGFibGUsXHJcbiAgICB3b3Jrc3BhY2VUYXNrVGFibGUsXHJcbiAgICBkZWxldGVkQXJjaGl2ZVRhYmxlLFxyXG4gICAgc3RyaXBlRXZlbnRUYWJsZSxcclxuICB9ID0gdXNlKFN0b3JhZ2VTdGFjayk7XHJcblxyXG4gIC8vIENyZWF0ZSBhIENvZ25pdG8gVXNlciBQb29sIGFuZCBJZGVudGl0eSBQb29sXHJcbiAgY29uc3QgdGVuYW50QXR0cmlidXRlID0gbmV3IFN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICBuYW1lOiAnY3VzdG9tOnRlbmFudCcsXHJcbiAgICBtdXRhYmxlOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgYXV0aCA9IG5ldyBDb2duaXRvKHN0YWNrLCBcIkF1dGhcIiwge1xyXG4gICAgbG9naW46IFtcImVtYWlsXCJdLFxyXG4gICAgY2RrOiB7XHJcbiAgICAgIHVzZXJQb29sOiB7XHJcbiAgICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcclxuICAgICAgICAvLyBhZHZhbmNlIHNlY3VyaXR5IG1vZGUgaW5jdXJzIG1vcmUgY29zdFxyXG4gICAgICAgIC8vIGFkdmFuY2VkU2VjdXJpdHlNb2RlOiBBZHZhbmNlZFNlY3VyaXR5TW9kZVR5cGUuRU5GT1JDRUQsXHJcbiAgICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xyXG4gICAgICAgICAgdGVuYW50OiB0ZW5hbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB1c2VySW52aXRhdGlvbjoge1xyXG4gICAgICAgICAgZW1haWxTdWJqZWN0OiBcIldlbGNvbWUgdG8gSVNPQ2xvdWRcIixcclxuICAgICAgICAgIGVtYWlsQm9keTogYDxoMj5XZWxjb21lIHRvIElTTyBDbG91ZCE8L2gyPlxyXG4gICAgICAgICAgPHA+XHJcbiAgICAgICAgICBZb3VyIGxvZ2luIGRldGFpbHMgYXJlIGFzIGZvbGxvd3M6PGJyLz48YnIvPlxyXG5Vc2VybmFtZToge3VzZXJuYW1lfTxici8+XHJcblRlbXBvcmFyeSBQYXNzd29yZDogeyMjIyN9XHJcbjwvcD4gICAgICAgICAgXHJcbiAgICAgICAgICA8cD5QbGVhc2UgdXNlIHRoZSBwcm92aWRlZCBpbmZvcm1hdGlvbiB0byBhY2Nlc3MgeW91ciBhY2NvdW50IGhlcmU6IDxhIGhyZWY9J2h0dHBzOi8vYXBwLmlzb2Nsb3VkLmNvbS5hdS8nPklTTyBDbG91ZDwvYT48L3A+XHJcbiAgICAgICAgICA8YnIvPjxici8+XHJcbiAgICAgICAgICA8aT5odHRwczovL2FwcC5pc29jbG91ZC5jb20uYXUvPC9pPmBcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIG1mYTogY29nbml0by5NZmEuT1BUSU9OQUwsXHJcbiAgICAgICAgLy8gbWZhU2Vjb25kRmFjdG9yOiBjb2duaXRvLm1mYVNlY29uZEZhY3RvcihvdHA9dHJ1ZSlcclxuXHJcbiAgICAgIH0sXHJcbiAgICAgIFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgXHJcblxyXG4gIGNvbnN0IHRvcExldmVsQWRtaW5zR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKFxyXG4gICAgc3RhY2ssIC8vIHRoaXNcclxuICAgIFwiVG9wTGV2ZWxBZG1pbnNcIixcclxuICAgIHtcclxuICAgICAgZ3JvdXBOYW1lOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgIHVzZXJQb29sSWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgIH1cclxuICApOyAgXHJcbiAgY29uc3QgYWRtaW5zR3JvdXAgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKFxyXG4gICAgc3RhY2ssIC8vIHRoaXNcclxuICAgIFwiQWRtaW5zXCIsXHJcbiAgICB7XHJcbiAgICAgIGdyb3VwTmFtZTogQURNSU5fR1JPVVAsXHJcbiAgICAgIHVzZXJQb29sSWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgIH1cclxuICApO1xyXG5cclxuXHJcblxyXG4gIGNvbnN0IGFkbWluVXNlcm5hbWUgPSBwcm9jZXNzLmVudi5BRE1JTl9VU0VSTkFNRTtcclxuXHJcbiAgY29uc3QgYWRtaW5Vc2VyID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xVc2VyKHN0YWNrLCBcIkFkbWluVXNlclwiLCB7XHJcbiAgICB1c2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICB1c2VybmFtZTogYWRtaW5Vc2VybmFtZSxcclxuICAgIGRlc2lyZWREZWxpdmVyeU1lZGl1bXM6IFtcIkVNQUlMXCJdLCBcclxuICAgIGZvcmNlQWxpYXNDcmVhdGlvbjogdHJ1ZSxcclxuICAgIHVzZXJBdHRyaWJ1dGVzOiBbXHJcbiAgICAgIHsgbmFtZTogXCJlbWFpbFwiLCB2YWx1ZTogcHJvY2Vzcy5lbnYuQURNSU5fRU1BSUwgfSxcclxuICAgICAgeyBuYW1lOiBcImN1c3RvbTp0ZW5hbnRcIiwgdmFsdWU6IFwiaXNvY2xvdWRcIiB9LFxyXG4gICAgXSxcclxuXHJcbiAgfSk7XHJcblxyXG5cclxuXHJcbiAgY29uc3QgY29nbml0b0FjY2Vzc1BvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgIGFjdGlvbnM6IFtcImNvZ25pdG8taWRwOipcIl0sXHJcbiAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICByZXNvdXJjZXM6IFtcclxuICAgICAgYGFybjphd3M6Y29nbml0by1pZHA6JHthcHAucmVnaW9ufToke2FwcC5hY2NvdW50fTp1c2VycG9vbC8ke2F1dGgudXNlclBvb2xJZH1gLFxyXG4gICAgXSxcclxuICB9KTtcclxuXHJcbiAgICBjb25zdCBjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICBhY3Rpb25zOiBbXCJjb2duaXRvLWlkcDpEZXNjcmliZSpcIiwgXCJjb2duaXRvLWlkcDpBZG1pbkdldFVzZXJcIl0sXHJcbiAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICByZXNvdXJjZXM6IFtcclxuICAgICAgYGFybjphd3M6Y29nbml0by1pZHA6JHthcHAucmVnaW9ufToke2FwcC5hY2NvdW50fTp1c2VycG9vbC8ke2F1dGgudXNlclBvb2xJZH1gLFxyXG4gICAgXSxcclxuICB9KTtcclxuICAvLyBDcmVhdGUgdGhlIEFQSVxyXG5cclxuICBjb25zdCBhcGkgPSBuZXcgQXBpKHN0YWNrLCBcIkFwaVwiLCB7XHJcbiAgICBjb3JzOiB0cnVlLFxyXG4gICAgYXV0aG9yaXplcnM6IHtcclxuICAgICAgand0OiB7XHJcbiAgICAgICAgdHlwZTogXCJ1c2VyX3Bvb2xcIixcclxuICAgICAgICB1c2VyUG9vbDoge1xyXG4gICAgICAgICAgaWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgIGNsaWVudElkczogW2F1dGgudXNlclBvb2xDbGllbnRJZF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBjdXN0b21Eb21haW46IGFwcC5zdGFnZSA9PT0gXCJwcm9kXCIgPyBgYXBpLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAgOiBhcHAuc3RhZ2UgPT09IFwic3RnXCIgPyBgYXBpLnN0Zy4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gIDogdW5kZWZpbmVkLFxyXG4gICAgY3VzdG9tRG9tYWluOlxyXG4gICAgICBhcHAuc3RhZ2UgPT09IFwicHJvZFwiID8gYGFwaS4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gIDogdW5kZWZpbmVkLFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgdGhyb3R0bGU6IHtcclxuICAgICAgICByYXRlOiAyMDAwLFxyXG4gICAgICAgIGJ1cnN0OiAxMDAsXHJcbiAgICAgIH0sXHJcbiAgICAgIGF1dGhvcml6ZXI6IFwiand0XCIsXHJcbiAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgIFRFTVBMQVRFX1RBQkxFOiB0ZW1wbGF0ZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIFRFTkFOVF9UQUJMRTogdGVuYW50VGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgVVNFUl9UQUJMRTogdXNlclRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIElTT19UQUJMRTogaXNvVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgRk9STV9UQUJMRTogZm9ybVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIERPQ19UQUJMRTogZG9jVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgV09SS1NQQUNFX1RBQkxFOiB3b3Jrc3BhY2VUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBXT1JLU1BBQ0VVU0VSX1RBQkxFOiB3b3Jrc3BhY2VVc2VyVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgV09SS1NQQUNFVEFTS19UQUJMRTogd29ya3NwYWNlVGFza1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIERFTEVURURBUkNISVZFX1RBQkxFOiBkZWxldGVkQXJjaGl2ZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIFNUUklQRUVWRU5UX1RBQkxFOiBzdHJpcGVFdmVudFRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIEJVQ0tFVDogYnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwZXJtaXNzaW9uczogW3dvcmtzcGFjZVVzZXJUYWJsZV0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcm91dGVzOiB7XHJcbiAgICAgIFwiUE9TVCAgIC9zdHJpcGUtd2ViaG9va1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3N0cmlwZS93ZWJob29rLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtzdHJpcGVFdmVudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFNUUklQRV9TRUNSRVRfS0VZIDogcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVksXHJcbiAgICAgICAgICAgIEVORFBPSU5UX1NFQ1JFVCA6IHByb2Nlc3MuZW52LkVORFBPSU5UX1NFQ1JFVFxyXG4gICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRob3JpemVyOiBcIm5vbmVcIixcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2UvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZS9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgICAvd29ya3NwYWNlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2UvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYWJsZSwgd29ya3NwYWNlVGFza1RhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvbXl3b3Jrc3BhY2VzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlbWVtYmVyL2dldG15d29ya3NwYWNlcy5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9tZW1iZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlbWVtYmVyL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVVzZXJUYWJsZSwgd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9tZW1iZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlbWVtYmVyL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVXNlclRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFdPUktTUEFDRV9BTExPV0VEX1JPTEU6IFdPUktTUEFDRV9PV05FUl9ST0xFLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L21lbWJlcnMve3VzZXJJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2VtZW1iZXIvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VVc2VyVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgV09SS1NQQUNFX0FMTE9XRURfUk9MRTogV09SS1NQQUNFX09XTkVSX1JPTEUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBcIkdFVCAgIC9teXRhc2tzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNldGFzay9nZXR1c2VydGFza3MubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhc2tUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvdXNlcnMve3VzZXJuYW1lfS90YXNrc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZXRhc2svZ2V0dXNlcnRhc2tzLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYXNrVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vdGFza3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhc2tUYWJsZSwgd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS90YXNrcy97dGFza0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZXRhc2svZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYXNrVGFibGUsIHdvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vdGFza3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFza1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS90YXNrcy97dGFza0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZXRhc2svdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYXNrVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9yZWN1cnJpbmctdGFza3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFza1RhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFdPUktTUEFDRV9BTExPV0VEX1JPTEU6IFdPUktTUEFDRV9PV05FUl9ST0xFLFxyXG4gICAgICAgICAgICBUQVNLX01PREU6IFJFQ1VSUklORyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vcmVjdXJyaW5nLXRhc2tzL3t0YXNrSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNldGFzay91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhc2tUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBXT1JLU1BBQ0VfQUxMT1dFRF9ST0xFOiBXT1JLU1BBQ0VfT1dORVJfUk9MRSxcclxuICAgICAgICAgICAgVEFTS19NT0RFOiBSRUNVUlJJTkcsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vdGFza3Mve3Rhc2tJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL2RlbGV0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFza1RhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFdPUktTUEFDRV9BTExPV0VEX1JPTEU6IFdPUktTUEFDRV9PV05FUl9ST0xFLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJQT1NUIC9kb2NzL3VwbG9hZC11cmxcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvZ2V0VXJsRm9yUHV0Lm1haW5cIixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2RvY3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbZG9jVGFibGUsIHdvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2RvY3Mve2RvY0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlLCB3b3Jrc3BhY2VUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZG9jc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2RvY3Mve2RvY0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2RvY3Mve2RvY0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFdPUktTUEFDRV9BTExPV0VEX1JPTEU6IFdPUktTUEFDRV9PV05FUl9ST0xFLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtcy97Zm9ybUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlLCBmb3JtVGFibGUsIHdvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZm9ybXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9mb3JtL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9SZWFkb25seUFjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBiaW5kOiBbZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zL3tmb3JtSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtcy97Zm9ybUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtmb3JtVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgV09SS1NQQUNFX0FMTE9XRURfUk9MRTogV09SS1NQQUNFX09XTkVSX1JPTEUsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBcIkdFVCAgIC90ZW1wbGF0ZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyB0ZW1wbGF0ZXMgYXJlIG5vdCB3b3Jrc3BhY2UgYXdhcmUgYnV0IGZvcm1zIGFyZS5cclxuICAgICAgLy8gVGhpcyBlbmRwb2ludCByZXR1cm5zIGZvcm0gY291bnQgZm9yIHRoZSB0ZW1wbGF0ZXMgc28gaXQgbmVlZHMgdG8gYmUgd29ya3NwYWNlIGF3YXJlLlxyXG4gICAgICBcIkdFVCAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vdGVtcGxhdGVzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvbGlzdFdpdGhGb3JtQ291bnQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGUsIGZvcm1UYWJsZSwgd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3RlbXBsYXRlcy97dGVtcGxhdGVJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGUsIGZvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAgL3RlbXBsYXRlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbXBsYXRlL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUICAgL3RlbXBsYXRlcy97dGVtcGxhdGVJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LCAgICAgIFxyXG4gICAgICBcIkRFTEVURSAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3RlbXBsYXRlcy97dGVtcGxhdGVJZH0vZm9ybXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9saXN0Rm9ybXMubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZSwgd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIGlzb1xyXG4gICAgICBcIkdFVCAgIC9pc29zL3RvcC1sZXZlbFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2lzby9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2lzb1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIHByb2Nlc3NcclxuICAgICAgXCJQVVQgICAvaXNvcy90b3AtbGV2ZWxcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9pc28vdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtpc29UYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBcIkdFVCAgIC90ZW5hbnRzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3RlbmFudHMve3RlbmFudElkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgIC90ZW5hbnRzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvdGVuYW50cy97dGVuYW50SWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgICAvdGVuYW50cy97dGVuYW50SWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2RlbGV0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL215dGVuYW50XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2dldG15dGVuYW50Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge30sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL215dXNlclwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgL3VzZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICAvLyB3b3Jrc3BhY2Ugb3duZXJzIGNhbiBzZWUgdGhlIGxpc3Qgb2YgdXNlcnMgdG8gYWRkL3JlbW92ZSB0aGVtIHRvL2Zyb20gd29ya3NwYWNlXHJcbiAgICAgICAgICAgIC8vIHNvIEFMTE9XRURfR1JPVVBTIGlzIG5vdCBzZXRcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdXNlclRhYmxlXSxcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdXNlclRhYmxlXSxcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdXNlclRhYmxlXSxcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt1c2VyVGFibGVdLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUIC91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgL3RlbmFudHMve3RlbmFudElkfS91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3VzZXJUYWJsZV0sXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vycy9mb3Jtcy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXR1c2VyZm9ybXMubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LCAgICAgIFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcblxyXG5cclxuXHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIlBPU1QgL2RvY3MvdXBsb2FkLXVybFwiLCBbXCJzM1wiXHJcbiAgICAvLyBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAvLyAgIGFjdGlvbnM6IFtcInMzOipcIl0sXHJcbiAgICAvLyAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgIC8vICAgcmVzb3VyY2VzOiBbXHJcbiAgICAvLyAgICAgYnVja2V0LmJ1Y2tldEFybixcclxuICAgIC8vICAgICBidWNrZXQuYnVja2V0QXJuICsgXCIvKlwiLFxyXG4gICAgLy8gICAgIC8vIGJ1Y2tldC5idWNrZXRBcm4gKyBcIi9wcml2YXRlLyR7Y29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmN1c3RvbTp0ZW5hbnR9LypcIixcclxuICAgIC8vICAgXSxcclxuICAgIC8vIH0pLFxyXG4gIF0pO1xyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJHRVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9kb2NzL3tkb2NJZH1cIiwgW1wiczNcIl0pO1xyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJHRVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtcy97Zm9ybUlkfVwiLCBbXCJzM1wiXSk7XHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIlBVVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zL3tmb3JtSWR9XCIsIFtcInMzXCJdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC91c2Vycy97dXNlcm5hbWV9XCIsIFtcInMzXCJdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC91c2Vyc1wiLCBbXCJzM1wiXSk7XHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIkdFVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzXCIsIFtcInMzXCJdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC9teXVzZXJcIiwgW1wiczNcIl0pO1xyXG4gIFxyXG4gIHdvcmtzcGFjZVRhc2tUYWJsZS5hZGRDb25zdW1lcnMoc3RhY2ssIHtcclxuICAgIG5vdGlmeToge1xyXG4gICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2V0YXNrL25vdGlmeS5tYWluXCIsXHJcbiAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b1JlYWRvbmx5QWNjZXNzUG9saWN5XSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICBTVEFHRTogc3RhY2suc3RhZ2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG4gIHdvcmtzcGFjZVRhc2tUYWJsZS5hdHRhY2hQZXJtaXNzaW9uc1RvQ29uc3VtZXIoXCJub3RpZnlcIiwgW1wic2VzXCJdKTtcclxuICBcclxuXHJcbiAgd29ya3NwYWNlVGFibGUuYWRkQ29uc3VtZXJzKHN0YWNrLCB7XHJcbiAgICBhcmNoaXZlcjoge1xyXG4gICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2UvYXJjaGl2ZXIubWFpblwiLFxyXG4gICAgICBlbnZpcm9ubWVudCA6IHtcclxuICAgICAgICBERUxFVEVEQVJDSElWRV9UQUJMRTogZGVsZXRlZEFyY2hpdmVUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgIH0sIFxyXG4gICAgICBiaW5kOiBbZGVsZXRlZEFyY2hpdmVUYWJsZV1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgZm9ybVRhYmxlLmFkZENvbnN1bWVycyhzdGFjaywge1xyXG4gICAgdGFza0ZvckFzc2lnbmVlIDoge1xyXG4gICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9mb3JtL2NyZWF0ZVRhc2tGb3JBc3NpZ25lZS5tYWluXCIsXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgV09SS1NQQUNFVEFTS19UQUJMRTogd29ya3NwYWNlVGFza1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICBURU1QTEFURV9UQUJMRTogdGVtcGxhdGVUYWJsZS50YWJsZU5hbWUsIFxyXG4gICAgICB9LFxyXG4gICAgICBiaW5kOiBbd29ya3NwYWNlVGFza1RhYmxlLCB0ZW1wbGF0ZVRhYmxlXVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBzdHJpcGVFdmVudFRhYmxlLmFkZENvbnN1bWVycyhzdGFjaywge1xyXG4gICAgZnVsbGZpbG9yZGVyIDoge1xyXG4gICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9zdHJpcGUvZnVsbGZpbG9yZGVyLm1haW5cIixcclxuICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICBTVFJJUEVFVkVOVF9UQUJMRTogc3RyaXBlRXZlbnRUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgVEVOQU5UX1RBQkxFOiB0ZW5hbnRUYWJsZS50YWJsZU5hbWUsIFxyXG4gICAgICAgIFVTRVJfVEFCTEU6IHVzZXJUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgQkFTSUNfUExBTl9QUklDRV9JRDogcHJvY2Vzcy5lbnYuQkFTSUNfUExBTl9QUklDRV9JRCxcclxuICAgICAgICBSRURfUExBTl9QUklDRV9JRDogcHJvY2Vzcy5lbnYuUkVEX1BMQU5fUFJJQ0VfSUQsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJpbmQ6IFtzdHJpcGVFdmVudFRhYmxlLCB0ZW5hbnRUYWJsZSwgdXNlclRhYmxlXVxyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHN0cmlwZUV2ZW50VGFibGUuYXR0YWNoUGVybWlzc2lvbnNUb0NvbnN1bWVyKFwiZnVsbGZpbG9yZGVyXCIsIFtcInNlc1wiXSk7XHJcblxyXG5cclxuICBhdXRoLmF0dGFjaFBlcm1pc3Npb25zRm9yQXV0aFVzZXJzKGF1dGgsIFtcclxuICAgIC8vIEFsbG93IGFjY2VzcyB0byB0aGUgQVBJXHJcbiAgICBhcGksXHJcblxyXG4gICAgIC8vIFBvbGljeSBncmFudGluZyBhY2Nlc3MgdG8gYSBzcGVjaWZpYyBmb2xkZXIgaW4gdGhlIGJ1Y2tldFxyXG4gICAgIC8vIHRoaXMgaXMgbm9uIHNlbnNpdGl2ZSBmaWxlcyBzdWNoIGFzIGxvZ29zXHJcbiAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICBhY3Rpb25zOiBbXCJzMzoqXCJdLFxyXG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgIHJlc291cmNlczogW1xyXG4gICAgICAgIGJ1Y2tldC5idWNrZXRBcm4gKyBcIi9wdWJsaWMvKlwiLFxyXG4gICAgICBdLFxyXG4gICAgfSksXHJcbiAgXSk7XHJcbiAgXHJcbiBcclxuIFxyXG4gIFxyXG4gIFxyXG5cclxuICBcclxuXHJcblxyXG4gIC8vIFNob3cgdGhlIGF1dGggcmVzb3VyY2VzIGluIHRoZSBvdXRwdXRcclxuICBzdGFjay5hZGRPdXRwdXRzKHtcclxuICAgIEFjY291bnQ6IGFwcC5hY2NvdW50LFxyXG4gICAgUmVnaW9uOiBhcHAucmVnaW9uLFxyXG4gICAgVXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgSWRlbnRpdHlQb29sSWQ6IGF1dGguY29nbml0b0lkZW50aXR5UG9vbElkLFxyXG4gICAgVXNlclBvb2xDbGllbnRJZDogYXV0aC51c2VyUG9vbENsaWVudElkLFxyXG4gICAgQXBpRW5kcG9pbnQ6IGFwaS5jdXN0b21Eb21haW5VcmwgfHwgYXBpLnVybCxcclxuICB9KTtcclxuICAvLyBSZXR1cm4gdGhlIGF1dGggcmVzb3VyY2VcclxuICByZXR1cm4ge1xyXG4gICAgYXV0aCxcclxuICAgIGFwaSxcclxuICAgIGNvZ25pdG9BY2Nlc3NQb2xpY3lcclxuICB9O1xyXG59XHJcbiIsICJpbXBvcnQgeyBCdWNrZXQsIFRhYmxlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFN0b3JhZ2VTdGFjayh7IHN0YWNrLCBhcHAgfSkge1xyXG4gIC8vIENyZWF0ZSBhbiBTMyBidWNrZXRcclxuXHJcbiAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldChzdGFjaywgXCJVcGxvYWRzXCIgLCB7XHJcbiAgICBjb3JzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtYXhBZ2U6IFwiMSBkYXlcIixcclxuICAgICAgICBhbGxvd2VkT3JpZ2luczogW1wiKlwiXSxcclxuICAgICAgICBhbGxvd2VkSGVhZGVyczogW1wiKlwiXSxcclxuICAgICAgICBhbGxvd2VkTWV0aG9kczogW1wiR0VUXCIsIFwiUFVUXCIsIFwiUE9TVFwiLCBcIkRFTEVURVwiLCBcIkhFQURcIl0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG5cclxuXHJcblxyXG4gIGNvbnN0IHRlbmFudFRhYmxlID0gbmV3IFRhYmxlKHN0YWNrLCBcIlRlbmFudFwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50SWQ6IFwic3RyaW5nXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRJZFwiIH0sXHJcblxyXG4gIH0pO1xyXG4gIFxyXG4gIGNvbnN0IHVzZXJUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJVc2VyXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIFVzZXJuYW1lOiBcInN0cmluZ1wiLFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiVXNlcm5hbWVcIiB9LFxyXG5cclxuICB9KTtcclxuICBcclxuICBjb25zdCB3b3Jrc3BhY2VUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJXb3Jrc3BhY2VcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIG5hbWU6IFwic3RyaW5nXCIsXHJcbiAgICAgIHBhcmVudElkOiBcInN0cmluZ1wiXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJ3b3Jrc3BhY2VJZFwiIH0sXHJcbiAgICBzdHJlYW06IFwibmV3X2FuZF9vbGRfaW1hZ2VzXCIsXHJcbiAgfSk7XHJcblxyXG5cclxuICBjb25zdCBkZWxldGVkQXJjaGl2ZVRhYmxlID0gbmV3IFRhYmxlKHN0YWNrLCBcIkRlbGV0ZWRBcmNoaXZlXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIGRlbGV0ZWRBdDogXCJudW1iZXJcIixcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcImRlbGV0ZWRBdFwiIH0sXHJcbiAgfSk7XHJcblxyXG5cclxuICBjb25zdCB3b3Jrc3BhY2VUYXNrVGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFwiV29ya3NwYWNlVGFza1wiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICB3b3Jrc3BhY2VJZDogXCJzdHJpbmdcIixcclxuICAgICAgdGVuYW50X3dvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB0YXNrSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHVzZXJJZDogXCJzdHJpbmdcIixcclxuICAgICAgaXNSZWN1cnJpbmc6IFwic3RyaW5nXCIsXHJcbiAgICAgIGVuZERhdGU6IFwibnVtYmVyXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRfd29ya3NwYWNlSWRcIiwgc29ydEtleTogXCJ0YXNrSWRcIiB9LFxyXG4gICAgZ2xvYmFsSW5kZXhlczoge1xyXG4gICAgICB1c2VySW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcInVzZXJJZFwiIH0sXHJcbiAgICAgIGlzUmVjdXJyaW5nSW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcImlzUmVjdXJyaW5nXCIgfSxcclxuICAgIH0sXHJcbiAgICBzdHJlYW06IFwibmV3X2FuZF9vbGRfaW1hZ2VzXCIsXHJcbiAgfSk7XHJcbiAgIFxyXG4gIGNvbnN0IHdvcmtzcGFjZVVzZXJUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJXb3Jrc3BhY2VVc2VyXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHdvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB0ZW5hbnRfd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHVzZXJJZDogXCJzdHJpbmdcIiwgXHJcbiAgICAgIHJvbGU6IFwic3RyaW5nXCIsIC8vIG93bmVyIG9yIG1lbWJlclxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50X3dvcmtzcGFjZUlkXCIsIHNvcnRLZXk6IFwidXNlcklkXCIgfSwgXHJcbiAgfSlcclxuIFxyXG4gIGNvbnN0IGlzb1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJJc29cIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgaXNvSWQ6IFwic3RyaW5nXCIsIC8vIHVuaXF1ZSBpZCBvZiB0aGlzIGN1c3RvbWlzZWQgdGVtcGxhdGVcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcImlzb0lkXCIgfSwgXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGZvcm1UYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJGb3JtXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHdvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB0ZW5hbnRfd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgICBmb3JtSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHVzZXJJZDogXCJzdHJpbmdcIiAvLyB3aGVuIHRoZSByZWNvcmQgaXMgZGlyZWN0bHkgcmVsYXRlZCB0byBhIHVzZXIuIGkuZS4gYSBjZXJ0aWZpY2F0ZSB0aGlzIGVtcGxveWVlIGhhc1xyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50X3dvcmtzcGFjZUlkXCIsIHNvcnRLZXk6IFwiZm9ybUlkXCIgfSxcclxuICAgIGdsb2JhbEluZGV4ZXM6IHtcclxuICAgICAgdXNlckluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJ1c2VySWRcIiB9LFxyXG4gICAgfSxcclxuICAgIHN0cmVhbTogXCJuZXdfYW5kX29sZF9pbWFnZXNcIixcclxuICB9KTtcclxuXHJcbiAgY29uc3QgdGVtcGxhdGVUYWJsZSA9IG5ldyBUYWJsZShzdGFjayAsIFwiVGVtcGxhdGVcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgdGVtcGxhdGVJZDogXCJzdHJpbmdcIiwgXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJ0ZW1wbGF0ZUlkXCIgfSxcclxuICB9KTtcclxuXHJcblxyXG4gIGNvbnN0IGRvY1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJEb2NcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHRlbmFudF93b3Jrc3BhY2VJZDogXCJzdHJpbmdcIixcclxuICAgICAgZG9jSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50X3dvcmtzcGFjZUlkXCIsIHNvcnRLZXk6IFwiZG9jSWRcIiB9LFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBzdHJpcGVFdmVudFRhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJTdHJpcGVFdmVudFwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgc3RyaXBlRXZlbnRJZDogXCJzdHJpbmdcIiwgLy8gdGhpcyBwcmV2ZW50cyBkb3VsYmUgcHJvY2Vzc2luZyBvZiBhIGR1cGxpY2F0ZSBzdHJpcGUgZXZlbnRcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInN0cmlwZUV2ZW50SWRcIiB9LFxyXG4gICAgc3RyZWFtOiBcIm5ld19pbWFnZVwiLFxyXG4gIH0pO1xyXG4gIFxyXG4gIHJldHVybiB7IFxyXG4gICAgdGVuYW50VGFibGUsXHJcbiAgICB1c2VyVGFibGUsXHJcbiAgICBpc29UYWJsZSxcclxuICAgIHRlbXBsYXRlVGFibGUsXHJcbiAgICBmb3JtVGFibGUsXHJcbiAgICBkb2NUYWJsZSxcclxuICAgIHdvcmtzcGFjZVRhYmxlLFxyXG4gICAgd29ya3NwYWNlVXNlclRhYmxlLFxyXG4gICAgd29ya3NwYWNlVGFza1RhYmxlLFxyXG4gICAgZGVsZXRlZEFyY2hpdmVUYWJsZSxcclxuICAgIHN0cmlwZUV2ZW50VGFibGUsXHJcbiAgICBidWNrZXQsXHJcbiAgfTtcclxufSIsICJleHBvcnQgY29uc3QgVE9QX0xFVkVMX0FETUlOX0dST1VQID0gJ3RvcC1sZXZlbC1hZG1pbnMnO1xyXG5leHBvcnQgY29uc3QgQURNSU5fR1JPVVAgPSAnYWRtaW5zJztcclxuZXhwb3J0IGNvbnN0IFdPUktTUEFDRV9PV05FUl9ST0xFID0gJ093bmVyJztcclxuZXhwb3J0IGNvbnN0IFdPUktTUEFDRV9NRU1CRVJfUk9MRSA9ICdNZW1iZXInO1xyXG5leHBvcnQgY29uc3QgTkNSX1dPUktTQVBDRV9JRCA9ICdOQ1InO1xyXG5leHBvcnQgY29uc3QgUkVDVVJSSU5HID0gJ1JFQ1VSUklORyc7XHJcbiIsICJpbXBvcnQgeyBTdGF0aWNTaXRlLCB1c2UgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuXHJcbmltcG9ydCB7IEF1dGhBbmRBcGlTdGFjayB9IGZyb20gXCIuL0F1dGhBbmRBcGlTdGFja1wiO1xyXG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tIFwiLi9TdG9yYWdlU3RhY2tcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGcm9udGVuZFN0YWNrKHsgc3RhY2ssIGFwcCB9KSB7XHJcbiAgY29uc3QgeyBhcGksIGF1dGggfSA9IHVzZShBdXRoQW5kQXBpU3RhY2spO1xyXG4gIGNvbnN0IHsgYnVja2V0IH0gPSB1c2UoU3RvcmFnZVN0YWNrKTtcclxuICAvLyBEZWZpbmUgb3VyIFJlYWN0IGFwcFxyXG4gIGNvbnN0IHNpdGUgPSBuZXcgU3RhdGljU2l0ZShzdGFjaywgXCJSZWFjdFNpdGVcIiwge1xyXG4gICAgY3VzdG9tRG9tYWluOlxyXG4gICAgICBhcHAuc3RhZ2UgPT09IFwicHJvZFwiXHJcbiAgICAgICAgPyB7XHJcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IGAke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgICAgICBkb21haW5BbGlhczogYHd3dy4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIC8vIDogXHJcbiAgICAgICAgLy8gYXBwLnN0YWdlID09PSBcInN0Z1wiXHJcbiAgICAgICAgLy8gPyB7XHJcbiAgICAgICAgLy8gICBkb21haW5OYW1lOiBgc3RnLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAsXHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIDogXHJcbiAgICAgICAgdW5kZWZpbmVkLFxyXG5cclxuICAgIHBhdGg6IFwiZnJvbnRlbmRcIixcclxuICAgIGJ1aWxkQ29tbWFuZDogXCJucG0gcnVuIGJ1aWxkXCIsIC8vIG9yIFwieWFybiBidWlsZFwiXHJcbiAgICBidWlsZE91dHB1dDogXCJidWlsZFwiLFxyXG4gICAgLy8gUGFzcyBpbiBvdXIgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBSRUFDVF9BUFBfQVBJX1VSTDogYXBpLmN1c3RvbURvbWFpblVybCB8fCBhcGkudXJsLFxyXG4gICAgICBSRUFDVF9BUFBfUkVHSU9OOiBhcHAucmVnaW9uLFxyXG4gICAgICBSRUFDVF9BUFBfQlVDS0VUOiBidWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgUkVBQ1RfQVBQX1VTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICBSRUFDVF9BUFBfSURFTlRJVFlfUE9PTF9JRDogYXV0aC5jb2duaXRvSWRlbnRpdHlQb29sSWQsXHJcbiAgICAgIFJFQUNUX0FQUF9VU0VSX1BPT0xfQ0xJRU5UX0lEOiBhdXRoLnVzZXJQb29sQ2xpZW50SWQsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG4gIC8vIFNob3cgdGhlIHVybCBpbiB0aGUgb3V0cHV0XHJcbiAgc3RhY2suYWRkT3V0cHV0cyh7XHJcbiAgICBTaXRlVXJsOiBzaXRlLmN1c3RvbURvbWFpblVybCB8fCBzaXRlLnVybCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLFxyXG4gIH0pO1xyXG59XHJcbiIsICJpbXBvcnQgeyBkZXBlbmRzT24sIFNjcmlwdCwgdXNlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IEF1dGhBbmRBcGlTdGFjayB9IGZyb20gXCIuL0F1dGhBbmRBcGlTdGFja1wiO1xyXG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tIFwiLi9TdG9yYWdlU3RhY2tcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBBZnRlckRlcGxveVN0YWNrKHsgc3RhY2sgfSkge1xyXG4gIGNvbnN0IHsgdGVuYW50VGFibGUsIGZvcm1UYWJsZSB9ID0gdXNlKFN0b3JhZ2VTdGFjayk7XHJcbiAgY29uc3QgeyBhdXRoLCBjb2duaXRvQWNjZXNzUG9saWN5IH0gPSB1c2UoQXV0aEFuZEFwaVN0YWNrKTtcclxuXHJcbiAgZGVwZW5kc09uKEF1dGhBbmRBcGlTdGFjayk7XHJcbiAgZGVwZW5kc09uKFN0b3JhZ2VTdGFjayk7XHJcbiAgbmV3IFNjcmlwdChzdGFjaywgXCJUb3BMZXZlbFRlbmFudFwiLCB7XHJcbiAgICBvbkNyZWF0ZToge1xyXG4gICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9zY3JpcHQvdG9wbGV2ZWx0ZW5hbnQuaGFuZGxlclwiLFxyXG4gICAgICBlbnZpcm9ubWVudDogeyBURU5BTlRfVEFCTEU6IHRlbmFudFRhYmxlLnRhYmxlTmFtZSB9LFxyXG4gICAgICBwZXJtaXNzaW9uczogW3RlbmFudFRhYmxlXSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIG5ldyBTY3JpcHQoc3RhY2ssIFwiVG9wTGV2ZWxBZG1pblwiLCB7XHJcbiAgICBvbkNyZWF0ZToge1xyXG4gICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9zY3JpcHQvdG9wbGV2ZWxhZG1pbi5oYW5kbGVyXCIsXHJcbiAgICAgIGVudmlyb25tZW50OiB7IFxyXG4gICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgIEFETUlOX1VTRVJOQU1FOiBwcm9jZXNzLmVudi5BRE1JTl9VU0VSTkFNRVxyXG4gICAgIH0sXHJcbiAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBuZXcgU2NyaXB0KHN0YWNrLCBcIkZvcm1zV2l0aG91dFVzZXJcIiwge1xyXG4gICAgb25DcmVhdGU6IHtcclxuICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvc2NyaXB0L3NldGVtcHR5dXNlci5oYW5kbGVyXCIsXHJcbiAgICAgIGVudmlyb25tZW50OiB7IEZPUk1fVEFCTEU6IGZvcm1UYWJsZS50YWJsZU5hbWUsIH0sXHJcbiAgICAgIHBlcm1pc3Npb25zOiBbZm9ybVRhYmxlXSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG59XHJcbiIsICJpbXBvcnQgeyBDcm9uLCB1c2UgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vU3RvcmFnZVN0YWNrXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gQ3JvblN0YWNrKHsgc3RhY2ssIGFwcCB9KSB7XHJcbiAgY29uc3QgeyB3b3Jrc3BhY2VUYXNrVGFibGUgfSA9IHVzZShTdG9yYWdlU3RhY2spO1xyXG4gIG5ldyBDcm9uKHN0YWNrLCBcImNyb25cIiwge1xyXG4gICAgc2NoZWR1bGU6IFwicmF0ZSgxIGRheSlcIixcclxuICAgIGpvYjoge1xyXG4gICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Nyb24vdGFzay1nZW5lcmF0b3IubWFpblwiLFxyXG4gICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYXNrVGFibGVdLFxyXG4gICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICBXT1JLU1BBQ0VUQVNLX1RBQkxFOiB3b3Jrc3BhY2VUYXNrVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG59IiwgIlxuaW1wb3J0IHR5cGUgeyBTU1RDb25maWcgfSBmcm9tIFwic3N0XCJcbmltcG9ydCB7IEF1dGhBbmRBcGlTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9BdXRoQW5kQXBpU3RhY2suanNcIlxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vc3RhY2tzL1N0b3JhZ2VTdGFjay5qc1wiXG5pbXBvcnQgeyBGcm9udGVuZFN0YWNrIH0gZnJvbSBcIi4vc3RhY2tzL0Zyb250ZW5kU3RhY2suanNcIlxuaW1wb3J0IHsgQWZ0ZXJEZXBsb3lTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9TY3JpcHRTdGFjay5qc1wiXG5pbXBvcnQgeyBDcm9uU3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvQ3JvblN0YWNrLmpzXCJcblxuZXhwb3J0IGRlZmF1bHQge1xuICBjb25maWcoaW5wdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogXCJzdXBwbGl4XCIsXG4gICAgICByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIixcbiAgICB9XG4gIH0sXG4gIHN0YWNrcyhhcHApIHtcbiAgICBhcHAuc2V0RGVmYXVsdEZ1bmN0aW9uUHJvcHMoe1xuICAgICAgcnVudGltZTogXCJub2RlanMxNi54XCIsXG4gICAgICBhcmNoaXRlY3R1cmU6IFwiYXJtXzY0XCIsXG4gICAgfSlcblxuICAgIGFwcFxuICAgICAgLnN0YWNrKFN0b3JhZ2VTdGFjaykgIFxuICAgICAgLnN0YWNrKENyb25TdGFjaylcbiAgICAgIC5zdGFjayhBdXRoQW5kQXBpU3RhY2spXG4gICAgICAuc3RhY2soRnJvbnRlbmRTdGFjaylcbiAgICAgIC5zdGFjayhBZnRlckRlcGxveVN0YWNrKVxuICB9LFxufSBzYXRpc2ZpZXMgU1NUQ29uZmlnIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFB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TUFBTSxPQUFBQyxZQUFXO0FBR25CLFNBQVMsVUFBVSxFQUFFLE9BQU8sSUFBSSxHQUFHO0FBQ3hDLFFBQU0sRUFBRSxtQkFBbUIsSUFBSUMsS0FBSSxZQUFZO0FBQy9DLE1BQUksS0FBSyxPQUFPLFFBQVE7QUFBQSxJQUN0QixVQUFVO0FBQUEsSUFDVixLQUFLO0FBQUEsTUFDSCxVQUFVO0FBQUEsUUFDUixTQUFTO0FBQUEsUUFDVCxNQUFNLENBQUMsa0JBQWtCO0FBQUEsUUFDekIsYUFBYTtBQUFBLFVBQ1gscUJBQXFCLG1CQUFtQjtBQUFBLFFBQzFDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFDSDtBQWRnQjs7O0FDS2hCLElBQU8scUJBQVE7QUFBQSxFQUNiLE9BQU8sT0FBTztBQUNaLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTyxLQUFLO0FBQ1YsUUFBSSx3QkFBd0I7QUFBQSxNQUMxQixTQUFTO0FBQUEsTUFDVCxjQUFjO0FBQUEsSUFDaEIsQ0FBQztBQUVELFFBQ0csTUFBTSxZQUFZLEVBQ2xCLE1BQU0sU0FBUyxFQUNmLE1BQU0sZUFBZSxFQUNyQixNQUFNLGFBQWEsRUFDbkIsTUFBTSxnQkFBZ0I7QUFBQSxFQUMzQjtBQUNGOyIsCiAgIm5hbWVzIjogWyJ1c2UiLCAidXNlIiwgInVzZSIsICJ1c2UiLCAidXNlIiwgInVzZSJdCn0K
