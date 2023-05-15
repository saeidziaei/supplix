import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/AuthAndApiStack.js
import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Cognito, Api, use } from "sst/constructs";

// stacks/StorageStack.js
import { Bucket, Table } from "sst/constructs";
import * as cdk from "aws-cdk-lib";
import * as cr from "aws-cdk-lib/custom-resources";
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
  const workspaceTable = new Table(stack, "Workspace", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      name: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "workspaceId" }
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
    isoTable,
    templateTable,
    formTable,
    docTable,
    workspaceTable,
    workspaceUserTable,
    bucket
  };
}
__name(StorageStack, "StorageStack");

// services/util/constants.js
var TOP_LEVEL_ADMIN_GROUP = "top-level-admins";
var ADMIN_GROUP = "admins";

// stacks/AuthAndApiStack.js
import { StringAttribute } from "aws-cdk-lib/aws-cognito";
function AuthAndApiStack({ stack, app }) {
  const {
    bucket,
    templateTable,
    tenantTable,
    isoTable,
    formTable,
    docTable,
    workspaceTable,
    workspaceUserTable
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
          ISO_TABLE: isoTable.tableName,
          FORM_TABLE: formTable.tableName,
          DOC_TABLE: docTable.tableName,
          WORKSPACE_TABLE: workspaceTable.tableName,
          WORKSPACEUSER_TABLE: workspaceUserTable.tableName,
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
          bind: [workspaceTable],
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
          bind: [workspaceUserTable]
        }
      },
      "POST  /workspaces/{workspaceId}/members": {
        function: {
          handler: "services/functions/workspacemember/create.main",
          bind: [workspaceUserTable]
        }
      },
      "DELETE /workspaces/{workspaceId}/members/{userId}": {
        function: {
          handler: "services/functions/workspacemember/delete.main",
          bind: [workspaceUserTable]
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
          bind: [docTable]
        }
      },
      "GET /workspaces/{workspaceId}/docs/{docId}": {
        function: {
          handler: "services/functions/doc/get.main",
          bind: [docTable]
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
          handler: "services/functions/doc/delete.main"
        }
      },
      "GET   /workspaces/{workspaceId}/forms": {
        function: {
          handler: "services/functions/form/list.main"
        }
      },
      "GET   /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/get.main",
          bind: [templateTable, formTable]
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
      "PUT   /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/update.main",
          permissions: [cognitoReadonlyAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          },
          bind: [formTable]
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
          bind: [templateTable, formTable]
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
          bind: [templateTable]
        }
      },
      "PUT   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/update.main",
          bind: [templateTable]
        }
      },
      "GET   /workspaces/{workspaceId}/templates/{templateId}/forms": {
        function: {
          handler: "services/functions/template/listForms.main",
          bind: [formTable]
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
          bind: [isoTable]
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
      "GET /users": {
        function: {
          handler: "services/functions/user/list.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          }
        }
      },
      "GET /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/list.main",
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
    api
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
    app.stack(StorageStack).stack(AuthAndApiStack).stack(FrontendStack);
  }
};
export {
  sst_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL0F1dGhBbmRBcGlTdGFjay5qcyIsICJzdGFja3MvU3RvcmFnZVN0YWNrLmpzIiwgInNlcnZpY2VzL3V0aWwvY29uc3RhbnRzLmpzIiwgInN0YWNrcy9Gcm9udGVuZFN0YWNrLmpzIiwgInNzdC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29nbml0b1wiO1xyXG5cclxuaW1wb3J0IHsgQ29nbml0bywgQXBpLCB1c2UgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vU3RvcmFnZVN0YWNrXCI7XHJcbmltcG9ydCB7IEFETUlOX0dST1VQLCBUT1BfTEVWRUxfQURNSU5fR1JPVVAgfSBmcm9tIFwiLi4vc2VydmljZXMvdXRpbC9jb25zdGFudHNcIjtcclxuaW1wb3J0IHsgU3RyaW5nQXR0cmlidXRlIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2duaXRvXCI7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEF1dGhBbmRBcGlTdGFjayh7IHN0YWNrLCBhcHAgfSkge1xyXG4gIGNvbnN0IHtcclxuICAgIGJ1Y2tldCxcclxuICAgIHRlbXBsYXRlVGFibGUsXHJcbiAgICB0ZW5hbnRUYWJsZSxcclxuICAgIGlzb1RhYmxlLFxyXG4gICAgZm9ybVRhYmxlLFxyXG4gICAgZG9jVGFibGUsXHJcbiAgICB3b3Jrc3BhY2VUYWJsZSxcclxuICAgIHdvcmtzcGFjZVVzZXJUYWJsZSxcclxuICB9ID0gdXNlKFN0b3JhZ2VTdGFjayk7XHJcblxyXG4gIC8vIENyZWF0ZSBhIENvZ25pdG8gVXNlciBQb29sIGFuZCBJZGVudGl0eSBQb29sXHJcbiAgY29uc3QgdGVuYW50QXR0cmlidXRlID0gbmV3IFN0cmluZ0F0dHJpYnV0ZSh7XHJcbiAgICBuYW1lOiAnY3VzdG9tOnRlbmFudCcsXHJcbiAgICBtdXRhYmxlOiBmYWxzZSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgYXV0aCA9IG5ldyBDb2duaXRvKHN0YWNrLCBcIkF1dGhcIiwge1xyXG4gICAgbG9naW46IFtcImVtYWlsXCJdLFxyXG4gICAgY2RrOiB7XHJcbiAgICAgIHVzZXJQb29sOiB7XHJcbiAgICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xyXG4gICAgICAgICAgdGVuYW50OiB0ZW5hbnRBdHRyaWJ1dGUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIFxyXG5cclxuICBjb25zdCB0b3BMZXZlbEFkbWluc0dyb3VwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cChcclxuICAgIHN0YWNrLCAvLyB0aGlzXHJcbiAgICBcIlRvcExldmVsQWRtaW5zXCIsXHJcbiAgICB7XHJcbiAgICAgIGdyb3VwTmFtZTogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICB1c2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICB9XHJcbiAgKTsgIFxyXG4gIGNvbnN0IGFkbWluc0dyb3VwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cChcclxuICAgIHN0YWNrLCAvLyB0aGlzXHJcbiAgICBcIkFkbWluc1wiLFxyXG4gICAge1xyXG4gICAgICBncm91cE5hbWU6IEFETUlOX0dST1VQLFxyXG4gICAgICB1c2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICB9XHJcbiAgKTtcclxuXHJcblxyXG5cclxuICBjb25zdCBhZG1pblVzZXJuYW1lID0gcHJvY2Vzcy5lbnYuQURNSU5fVVNFUk5BTUU7XHJcblxyXG4gIGNvbnN0IGFkbWluVXNlciA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sVXNlcihzdGFjaywgXCJBZG1pblVzZXJcIiwge1xyXG4gICAgdXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgdXNlcm5hbWU6IGFkbWluVXNlcm5hbWUsXHJcbiAgICBkZXNpcmVkRGVsaXZlcnlNZWRpdW1zOiBbXCJFTUFJTFwiXSwgXHJcbiAgICBmb3JjZUFsaWFzQ3JlYXRpb246IHRydWUsXHJcbiAgICB1c2VyQXR0cmlidXRlczogW1xyXG4gICAgICB7IG5hbWU6IFwiZW1haWxcIiwgdmFsdWU6IHByb2Nlc3MuZW52LkFETUlOX0VNQUlMIH0sXHJcbiAgICAgIHsgbmFtZTogXCJjdXN0b206dGVuYW50XCIsIHZhbHVlOiBcImlzb2Nsb3VkXCIgfSxcclxuICAgIF0sXHJcblxyXG4gIH0pO1xyXG4gIC8vIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gIC8vIGNvbnN0IGFkbWluR3JvdXBNZW1iZXJzaGlwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xVc2VyVG9Hcm91cEF0dGFjaG1lbnQoXHJcbiAgLy8gICBzdGFjayxcclxuICAvLyAgIFwiQWRtaW5Vc2VyVG9Ub3BMZXZlbEFkbWluc1wiLFxyXG4gIC8vICAge1xyXG4gIC8vICAgICBncm91cE5hbWU6IHRvcExldmVsQWRtaW5zR3JvdXAuZ3JvdXBOYW1lLFxyXG4gIC8vICAgICB1c2VybmFtZTogYWRtaW5Vc2VyLnVzZXJuYW1lLFxyXG4gIC8vICAgICB1c2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgLy8gICAgIGRlcGVuZHNPbjogW2FkbWluVXNlciwgdG9wTGV2ZWxBZG1pbnNHcm91cF1cclxuICAvLyAgIH1cclxuICAgIFxyXG4gIC8vICk7XHJcbiAgLy8gfSwgIDUwMDApOyAvLyB3YWl0IGZvciA1IHNlY29uZCBiZWZvcmUgYWRkaW5nIHRoZSB1c2VyIHRvIHRoZSBncm91cFxyXG5cclxuXHJcbiAgY29uc3QgY29nbml0b0FjY2Vzc1BvbGljeSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgIGFjdGlvbnM6IFtcImNvZ25pdG8taWRwOipcIl0sXHJcbiAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICByZXNvdXJjZXM6IFtcclxuICAgICAgYGFybjphd3M6Y29nbml0by1pZHA6JHthcHAucmVnaW9ufToke2FwcC5hY2NvdW50fTp1c2VycG9vbC8ke2F1dGgudXNlclBvb2xJZH1gLFxyXG4gICAgXSxcclxuICB9KTtcclxuXHJcbiAgICBjb25zdCBjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICBhY3Rpb25zOiBbXCJjb2duaXRvLWlkcDpEZXNjcmliZSpcIiwgXCJjb2duaXRvLWlkcDpBZG1pbkdldFVzZXJcIl0sXHJcbiAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICByZXNvdXJjZXM6IFtcclxuICAgICAgYGFybjphd3M6Y29nbml0by1pZHA6JHthcHAucmVnaW9ufToke2FwcC5hY2NvdW50fTp1c2VycG9vbC8ke2F1dGgudXNlclBvb2xJZH1gLFxyXG4gICAgXSxcclxuICB9KTtcclxuICAvLyBDcmVhdGUgdGhlIEFQSVxyXG4gIGNvbnN0IGFwaSA9IG5ldyBBcGkoc3RhY2ssIFwiQXBpXCIsIHtcclxuICAgIGNvcnM6IHRydWUsXHJcbiAgICBhdXRob3JpemVyczoge1xyXG4gICAgICBqd3Q6IHtcclxuICAgICAgICB0eXBlOiBcInVzZXJfcG9vbFwiLFxyXG4gICAgICAgIHVzZXJQb29sOiB7XHJcbiAgICAgICAgICBpZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgY2xpZW50SWRzOiBbYXV0aC51c2VyUG9vbENsaWVudElkXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIC8vIGN1c3RvbURvbWFpbjogYXBwLnN0YWdlID09PSBcInByb2RcIiA/IGBhcGkuJHtwcm9jZXNzLmVudi5ET01BSU59YCA6IGFwcC5zdGFnZSA9PT0gXCJzdGdcIiA/IGBhcGkuc3RnLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAgOiB1bmRlZmluZWQsXHJcbiAgICBjdXN0b21Eb21haW46XHJcbiAgICAgIGFwcC5zdGFnZSA9PT0gXCJwcm9kXCIgPyBgYXBpLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAgOiB1bmRlZmluZWQsXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICBhdXRob3JpemVyOiBcImp3dFwiLFxyXG4gICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICBURU1QTEFURV9UQUJMRTogdGVtcGxhdGVUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBURU5BTlRfVEFCTEU6IHRlbmFudFRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIElTT19UQUJMRTogaXNvVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgRk9STV9UQUJMRTogZm9ybVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIERPQ19UQUJMRTogZG9jVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgV09SS1NQQUNFX1RBQkxFOiB3b3Jrc3BhY2VUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBXT1JLU1BBQ0VVU0VSX1RBQkxFOiB3b3Jrc3BhY2VVc2VyVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgQlVDS0VUOiBidWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBlcm1pc3Npb25zOiBbd29ya3NwYWNlVXNlclRhYmxlXSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICByb3V0ZXM6IHtcclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZS9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgIC93b3Jrc3BhY2VzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAgIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2UvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZS9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvbXl3b3Jrc3BhY2VzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlbWVtYmVyL2dldG15d29ya3NwYWNlcy5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbd29ya3NwYWNlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9tZW1iZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvd29ya3NwYWNlbWVtYmVyL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVVzZXJUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L21lbWJlcnNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy93b3Jrc3BhY2VtZW1iZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt3b3Jrc3BhY2VVc2VyVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vbWVtYmVycy97dXNlcklkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3dvcmtzcGFjZW1lbWJlci9kZWxldGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3dvcmtzcGFjZVVzZXJUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiUE9TVCAvZG9jcy91cGxvYWQtdXJsXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2dldFVybEZvclB1dC5tYWluXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9kb2NzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2RvY3Mve2RvY0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9kb2NzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbZG9jVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZG9jcy97ZG9jSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2RlbGV0ZS5tYWluXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS9mb3Jtc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vbGlzdC5tYWluXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zL3tmb3JtSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGUsIGZvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L2Zvcm1zL3tmb3JtSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL3RlbXBsYXRlc1wiOiB7IFxyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyB0ZW1wbGF0ZXMgYXJlIG5vdCB3b3Jrc3BhY2UgYXdhcmUgYnV0IGZvcm1zIGFyZS4gXHJcbiAgICAgIC8vIFRoaXMgZW5kcG9pbnQgcmV0dXJucyBmb3JtIGNvdW50IGZvciB0aGUgdGVtcGxhdGVzIHNvIGl0IG5lZWRzIHRvIGJlIHdvcmtzcGFjZSBhd2FyZS5cclxuICAgICAgXCJHRVQgICAvd29ya3NwYWNlcy97d29ya3NwYWNlSWR9L3RlbXBsYXRlc1wiOiB7IFxyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9saXN0V2l0aEZvcm1Db3VudC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZSwgZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlLCBmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgIC90ZW1wbGF0ZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUICAgL3RlbXBsYXRlcy97dGVtcGxhdGVJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3dvcmtzcGFjZXMve3dvcmtzcGFjZUlkfS90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9L2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvbGlzdEZvcm1zLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIGlzb1xyXG4gICAgICBcIkdFVCAgIC9pc29zL3RvcC1sZXZlbFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2lzby9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2lzb1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIHByb2Nlc3NcclxuICAgICAgXCJQVVQgICAvaXNvcy90b3AtbGV2ZWxcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9pc28vdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtpc29UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL3RlbmFudHNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvdGVuYW50cy97dGVuYW50SWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAgL3RlbmFudHNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAgIC90ZW5hbnRzL3t0ZW5hbnRJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkRFTEVURSAgIC90ZW5hbnRzL3t0ZW5hbnRJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvZGVsZXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvbXl0ZW5hbnRcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvZ2V0bXl0ZW5hbnQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIC8vIHdvcmtzcGFjZSBvd25lcnMgY2FuIHNlZSB0aGUgbGlzdCBvZiB1c2VycyB0byBhZGQvcmVtb3ZlIHRoZW0gdG8vZnJvbSB3b3Jrc3BhY2UgXHJcbiAgICAgICAgICAgIC8vIHNvIEFMTE9XRURfR1JPVVBTIGlzIG5vdCBzZXRcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVAsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC90ZW5hbnRzL3t0ZW5hbnRJZH0vdXNlcnMve3VzZXJuYW1lfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgL3RlbmFudHMve3RlbmFudElkfS91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgL3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcblxyXG5cclxuXHJcblxyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJQT1NUIC9kb2NzL3VwbG9hZC11cmxcIiwgW1wiczNcIlxyXG4gICAgLy8gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgLy8gICBhY3Rpb25zOiBbXCJzMzoqXCJdLFxyXG4gICAgLy8gICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAvLyAgIHJlc291cmNlczogW1xyXG4gICAgLy8gICAgIGJ1Y2tldC5idWNrZXRBcm4sXHJcbiAgICAvLyAgICAgYnVja2V0LmJ1Y2tldEFybiArIFwiLypcIixcclxuICAgIC8vICAgICAvLyBidWNrZXQuYnVja2V0QXJuICsgXCIvcHJpdmF0ZS8ke2NvZ25pdG8taWRlbnRpdHkuYW1hem9uYXdzLmNvbTpjdXN0b206dGVuYW50fS8qXCIsXHJcbiAgICAvLyAgIF0sXHJcbiAgICAvLyB9KSxcclxuICBdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZG9jcy97ZG9jSWR9XCIsIFtcInMzXCJdKTtcclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiR0VUIC93b3Jrc3BhY2VzL3t3b3Jrc3BhY2VJZH0vZm9ybXMve2Zvcm1JZH1cIiwgW1wiczNcIl0pO1xyXG5cclxuXHJcbiAgYXV0aC5hdHRhY2hQZXJtaXNzaW9uc0ZvckF1dGhVc2VycyhhdXRoLCBbXHJcbiAgICAvLyBBbGxvdyBhY2Nlc3MgdG8gdGhlIEFQSVxyXG4gICAgYXBpLFxyXG5cclxuICAgICAvLyBQb2xpY3kgZ3JhbnRpbmcgYWNjZXNzIHRvIGEgc3BlY2lmaWMgZm9sZGVyIGluIHRoZSBidWNrZXRcclxuICAgICAvLyB0aGlzIGlzIG5vbiBzZW5zaXRpdmUgZmlsZXMgc3VjaCBhcyBsb2dvc1xyXG4gICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgYWN0aW9uczogW1wiczM6KlwiXSxcclxuICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICBidWNrZXQuYnVja2V0QXJuICsgXCIvcHVibGljLypcIixcclxuICAgICAgXSxcclxuICAgIH0pLFxyXG4gIF0pO1xyXG4gIFxyXG4gXHJcbiBcclxuIFxyXG5cclxuICBcclxuXHJcblxyXG4gIC8vIFNob3cgdGhlIGF1dGggcmVzb3VyY2VzIGluIHRoZSBvdXRwdXRcclxuICBzdGFjay5hZGRPdXRwdXRzKHtcclxuICAgIEFjY291bnQ6IGFwcC5hY2NvdW50LFxyXG4gICAgUmVnaW9uOiBhcHAucmVnaW9uLFxyXG4gICAgVXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgSWRlbnRpdHlQb29sSWQ6IGF1dGguY29nbml0b0lkZW50aXR5UG9vbElkLFxyXG4gICAgVXNlclBvb2xDbGllbnRJZDogYXV0aC51c2VyUG9vbENsaWVudElkLFxyXG4gICAgQXBpRW5kcG9pbnQ6IGFwaS5jdXN0b21Eb21haW5VcmwgfHwgYXBpLnVybCxcclxuICB9KTtcclxuICAvLyBSZXR1cm4gdGhlIGF1dGggcmVzb3VyY2VcclxuICByZXR1cm4ge1xyXG4gICAgYXV0aCxcclxuICAgIGFwaSxcclxuICB9O1xyXG59XHJcbiIsICJpbXBvcnQgeyBCdWNrZXQsIFRhYmxlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGNyIGZyb20gJ2F3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFN0b3JhZ2VTdGFjayh7IHN0YWNrLCBhcHAgfSkge1xyXG4gIC8vIENyZWF0ZSBhbiBTMyBidWNrZXRcclxuXHJcbiAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldChzdGFjaywgXCJVcGxvYWRzXCIgLCB7XHJcbiAgICBjb3JzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtYXhBZ2U6IFwiMSBkYXlcIixcclxuICAgICAgICBhbGxvd2VkT3JpZ2luczogW1wiKlwiXSxcclxuICAgICAgICBhbGxvd2VkSGVhZGVyczogW1wiKlwiXSxcclxuICAgICAgICBhbGxvd2VkTWV0aG9kczogW1wiR0VUXCIsIFwiUFVUXCIsIFwiUE9TVFwiLCBcIkRFTEVURVwiLCBcIkhFQURcIl0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG5cclxuXHJcblxyXG4gIGNvbnN0IHRlbmFudFRhYmxlID0gbmV3IFRhYmxlKHN0YWNrLCBcIlRlbmFudFwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50SWQ6IFwic3RyaW5nXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRJZFwiIH0sXHJcblxyXG4gIH0pO1xyXG5cclxuICBjb25zdCB3b3Jrc3BhY2VUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJXb3Jrc3BhY2VcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIG5hbWU6IFwic3RyaW5nXCIsXHJcbiAgICAgIC8vIGVudGl0aWVzIFtdIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwid29ya3NwYWNlSWRcIiB9LFxyXG4gICAgXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHdvcmtzcGFjZVVzZXJUYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJXb3Jrc3BhY2VVc2VyXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHdvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB0ZW5hbnRfd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHVzZXJJZDogXCJzdHJpbmdcIiwgXHJcbiAgICAgIHJvbGU6IFwic3RyaW5nXCIsIC8vIG93bmVyIG9yIG1lbWJlclxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50X3dvcmtzcGFjZUlkXCIsIHNvcnRLZXk6IFwidXNlcklkXCIgfSwgXHJcbiAgfSlcclxuIFxyXG4gIGNvbnN0IGlzb1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJJc29cIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgaXNvSWQ6IFwic3RyaW5nXCIsIC8vIHVuaXF1ZSBpZCBvZiB0aGlzIGN1c3RvbWlzZWQgdGVtcGxhdGVcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudFwiLCBzb3J0S2V5OiBcImlzb0lkXCIgfSwgXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGZvcm1UYWJsZSA9IG5ldyBUYWJsZShzdGFjaywgXCJGb3JtXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHdvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB0ZW5hbnRfd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIGZvcm1JZDogXCJzdHJpbmdcIixcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudF93b3Jrc3BhY2VJZFwiLCBzb3J0S2V5OiBcImZvcm1JZFwiIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHRlbXBsYXRlVGFibGUgPSBuZXcgVGFibGUoc3RhY2sgLCBcIlRlbXBsYXRlXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHRlbXBsYXRlSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwidGVtcGxhdGVJZFwiIH0sXHJcbiAgfSk7XHJcblxyXG5cclxuICBjb25zdCBkb2NUYWJsZSA9IG5ldyBUYWJsZShzdGFjayAsIFwiRG9jXCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIHdvcmtzcGFjZUlkOiBcInN0cmluZ1wiLFxyXG4gICAgICB0ZW5hbnRfd29ya3NwYWNlSWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIGRvY0lkOiBcInN0cmluZ1wiLCBcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudF93b3Jrc3BhY2VJZFwiLCBzb3J0S2V5OiBcImRvY0lkXCIgfSxcclxuICB9KTtcclxuXHJcblxyXG5cclxuICAvLyBSZXR1cm4gdGhlIGJ1Y2tldCBhbmQgdGFibGUgcmVzb3VyY2VzXHJcbiAgcmV0dXJuIHtcclxuICAgIHRlbmFudFRhYmxlLFxyXG4gICAgaXNvVGFibGUsXHJcbiAgICB0ZW1wbGF0ZVRhYmxlLFxyXG4gICAgZm9ybVRhYmxlLFxyXG4gICAgZG9jVGFibGUsXHJcbiAgICB3b3Jrc3BhY2VUYWJsZSxcclxuICAgIHdvcmtzcGFjZVVzZXJUYWJsZSxcclxuICAgIGJ1Y2tldCxcclxuICB9O1xyXG59IiwgImV4cG9ydCBjb25zdCBUT1BfTEVWRUxfQURNSU5fR1JPVVAgPSAndG9wLWxldmVsLWFkbWlucyc7XHJcbmV4cG9ydCBjb25zdCBBRE1JTl9HUk9VUCA9ICdhZG1pbnMnO1xyXG4iLCAiaW1wb3J0IHsgU3RhdGljU2l0ZSwgdXNlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcbi8vIGltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSBcIi4vQXBpU3RhY2tcIjtcclxuLy8gaW1wb3J0IHsgQXV0aFN0YWNrIH0gZnJvbSBcIi4vQXV0aFN0YWNrXCI7XHJcbmltcG9ydCB7IEF1dGhBbmRBcGlTdGFjayB9IGZyb20gXCIuL0F1dGhBbmRBcGlTdGFja1wiO1xyXG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tIFwiLi9TdG9yYWdlU3RhY2tcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGcm9udGVuZFN0YWNrKHsgc3RhY2ssIGFwcCB9KSB7XHJcbiAgY29uc3QgeyBhcGksIGF1dGggfSA9IHVzZShBdXRoQW5kQXBpU3RhY2spO1xyXG4gIGNvbnN0IHsgYnVja2V0IH0gPSB1c2UoU3RvcmFnZVN0YWNrKTtcclxuICAvLyBEZWZpbmUgb3VyIFJlYWN0IGFwcFxyXG4gIGNvbnN0IHNpdGUgPSBuZXcgU3RhdGljU2l0ZShzdGFjaywgXCJSZWFjdFNpdGVcIiwge1xyXG4gICAgY3VzdG9tRG9tYWluOlxyXG4gICAgICBhcHAuc3RhZ2UgPT09IFwicHJvZFwiXHJcbiAgICAgICAgPyB7XHJcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IGAke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgICAgICBkb21haW5BbGlhczogYHd3dy4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIC8vIDogXHJcbiAgICAgICAgLy8gYXBwLnN0YWdlID09PSBcInN0Z1wiXHJcbiAgICAgICAgLy8gPyB7XHJcbiAgICAgICAgLy8gICBkb21haW5OYW1lOiBgc3RnLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAsXHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIDogXHJcbiAgICAgICAgdW5kZWZpbmVkLFxyXG5cclxuICAgIHBhdGg6IFwiZnJvbnRlbmRcIixcclxuICAgIGJ1aWxkQ29tbWFuZDogXCJucG0gcnVuIGJ1aWxkXCIsIC8vIG9yIFwieWFybiBidWlsZFwiXHJcbiAgICBidWlsZE91dHB1dDogXCJidWlsZFwiLFxyXG4gICAgLy8gUGFzcyBpbiBvdXIgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBSRUFDVF9BUFBfQVBJX1VSTDogYXBpLmN1c3RvbURvbWFpblVybCB8fCBhcGkudXJsLFxyXG4gICAgICBSRUFDVF9BUFBfUkVHSU9OOiBhcHAucmVnaW9uLFxyXG4gICAgICBSRUFDVF9BUFBfQlVDS0VUOiBidWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgUkVBQ1RfQVBQX1VTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICBSRUFDVF9BUFBfSURFTlRJVFlfUE9PTF9JRDogYXV0aC5jb2duaXRvSWRlbnRpdHlQb29sSWQsXHJcbiAgICAgIFJFQUNUX0FQUF9VU0VSX1BPT0xfQ0xJRU5UX0lEOiBhdXRoLnVzZXJQb29sQ2xpZW50SWQsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG4gIC8vIFNob3cgdGhlIHVybCBpbiB0aGUgb3V0cHV0XHJcbiAgc3RhY2suYWRkT3V0cHV0cyh7XHJcbiAgICBTaXRlVXJsOiBzaXRlLmN1c3RvbURvbWFpblVybCB8fCBzaXRlLnVybCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLFxyXG4gIH0pO1xyXG59XHJcbiIsICJcbmltcG9ydCB0eXBlIHsgU1NUQ29uZmlnIH0gZnJvbSBcInNzdFwiXG5pbXBvcnQgeyBBdXRoQW5kQXBpU3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvQXV0aEFuZEFwaVN0YWNrLmpzXCJcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9TdG9yYWdlU3RhY2suanNcIlxuaW1wb3J0IHsgRnJvbnRlbmRTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9Gcm9udGVuZFN0YWNrLmpzXCJcblxuZXhwb3J0IGRlZmF1bHQge1xuICBjb25maWcoaW5wdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogXCJzdXBwbGl4XCIsXG4gICAgICByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIixcbiAgICB9XG4gIH0sXG4gIHN0YWNrcyhhcHApIHtcbiAgICBhcHAuc2V0RGVmYXVsdEZ1bmN0aW9uUHJvcHMoe1xuICAgICAgcnVudGltZTogXCJub2RlanMxNi54XCIsXG4gICAgICBhcmNoaXRlY3R1cmU6IFwiYXJtXzY0XCIsXG4gICAgfSlcblxuICAgIGFwcFxuICAgICAgLnN0YWNrKFN0b3JhZ2VTdGFjaykgIFxuICAgICAgLnN0YWNrKEF1dGhBbmRBcGlTdGFjaylcbiAgICAgIC5zdGFjayhGcm9udGVuZFN0YWNrKVxuICB9LFxufSBzYXRpc2ZpZXMgU1NUQ29uZmlnIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFBQSxZQUFZLFNBQVM7QUFDckIsWUFBWSxhQUFhO0FBRXpCLFNBQVMsU0FBUyxLQUFLLFdBQVc7OztBQ0hsQyxTQUFTLFFBQVEsYUFBYTtBQUM5QixZQUFZLFNBQVM7QUFDckIsWUFBWSxRQUFRO0FBRWIsU0FBUyxhQUFhLEVBQUUsT0FBTyxJQUFJLEdBQUc7QUFHM0MsUUFBTSxTQUFTLElBQUksT0FBTyxPQUFPLFdBQVk7QUFBQSxJQUMzQyxNQUFNO0FBQUEsTUFDSjtBQUFBLFFBQ0UsUUFBUTtBQUFBLFFBQ1IsZ0JBQWdCLENBQUMsR0FBRztBQUFBLFFBQ3BCLGdCQUFnQixDQUFDLEdBQUc7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QWdCO0FBQUEsTUFDdkIsU0FBUyxDQUFDLE1BQU07QUFBQSxNQUNoQixRQUFZLFdBQU87QUFBQSxNQUNuQixXQUFXO0FBQUEsUUFDVCxPQUFPLFlBQVk7QUFBQSxNQUNyQjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0gsQ0FBQztBQVVELFFBQU0sV0FBVztBQUFBLElBQ2YsU0FBUyxJQUFJO0FBQUEsSUFDYixRQUFRLElBQUk7QUFBQSxJQUNaLFlBQVksS0FBSztBQUFBLElBQ2pCLGdCQUFnQixLQUFLO0FBQUEsSUFDckIsa0JBQWtCLEtBQUs7QUFBQSxJQUN2QixhQUFhLElBQUksbUJBQW1CLElBQUk7QUFBQSxFQUMxQyxDQUFDO0FBRUQsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUNGO0FBamZnQjs7O0FHVGhCLFNBQVMsWUFBWSxPQUFBQSxZQUFXO0FBTXpCLFNBQVMsY0FBYyxFQUFFLE9BQU8sSUFBSSxHQUFHO0FBQzVDLFFBQU0sRUFBRSxLQUFLLEtBQUssSUFBSUMsS0FBSSxlQUFlO0FBQ3pDLFFBQU0sRUFBRSxPQUFPLElBQUlBLEtBQUksWUFBWTtBQUVuQyxRQUFNLE9BQU8sSUFBSSxXQUFXLE9BQU8sYUFBYTtBQUFBLElBQzlDLGNBQ0UsSUFBSSxVQUFVLFNBQ1Y7QUFBQSxNQUNFLFlBQVksR0FBRyxRQUFRLElBQUk7QUFBQSxNQUMzQixhQUFhLE9BQU8sUUFBUSxJQUFJO0FBQUEsSUFDbEMsSUFPRjtBQUFBLElBRUosTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsYUFBYTtBQUFBLElBRWIsYUFBYTtBQUFBLE1BQ1gsbUJBQW1CLElBQUksbUJBQW1CLElBQUk7QUFBQSxNQUM5QyxrQkFBa0IsSUFBSTtBQUFBLE1BQ3RCLGtCQUFrQixPQUFPO0FBQUEsTUFDekIsd0JBQXdCLEtBQUs7QUFBQSxNQUM3Qiw0QkFBNEIsS0FBSztBQUFBLE1BQ2pDLCtCQUErQixLQUFLO0FBQUEsSUFDdEM7QUFBQSxFQUNGLENBQUM7QUFFRCxRQUFNLFdBQVc7QUFBQSxJQUNmLFNBQVMsS0FBSyxtQkFBbUIsS0FBSyxPQUFPO0FBQUEsRUFDL0MsQ0FBQztBQUNIO0FBcENnQjs7O0FDQWhCLElBQU8scUJBQVE7QUFBQSxFQUNiLE9BQU8sT0FBTztBQUNaLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTyxLQUFLO0FBQ1YsUUFBSSx3QkFBd0I7QUFBQSxNQUMxQixTQUFTO0FBQUEsTUFDVCxjQUFjO0FBQUEsSUFDaEIsQ0FBQztBQUVELFFBQ0csTUFBTSxZQUFZLEVBQ2xCLE1BQU0sZUFBZSxFQUNyQixNQUFNLGFBQWE7QUFBQSxFQUN4QjtBQUNGOyIsCiAgIm5hbWVzIjogWyJ1c2UiLCAidXNlIl0KfQo=
