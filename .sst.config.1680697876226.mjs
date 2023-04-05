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
      formId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "formId" }
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
      docId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "docId" }
  });
  return {
    tenantTable,
    isoTable,
    formTable,
    templateTable,
    docTable,
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
    formTable,
    templateTable,
    tenantTable,
    isoTable,
    docTable
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
          FORM_TABLE: formTable.tableName,
          TEMPLATE_TABLE: templateTable.tableName,
          TENANT_TABLE: tenantTable.tableName,
          ISO_TABLE: isoTable.tableName,
          DOC_TABLE: docTable.tableName,
          BUCKET: bucket.bucketName
        }
      }
    },
    routes: {
      "POST /docs/upload-url": {
        function: {
          handler: "services/functions/doc/getUrlForPut.main"
        }
      },
      "GET /docs": {
        function: {
          handler: "services/functions/doc/list.main",
          bind: [docTable]
        }
      },
      "GET /docs/{docId}": {
        function: {
          handler: "services/functions/doc/get.main",
          bind: [docTable]
        }
      },
      "POST /docs": {
        function: {
          handler: "services/functions/doc/create.main",
          bind: [docTable]
        }
      },
      "DELETE /docs/{docId}": {
        function: {
          handler: "services/functions/doc/delete.main"
        }
      },
      "GET   /forms": {
        function: {
          handler: "services/functions/form/list.main"
        }
      },
      "GET   /forms/{formId}": {
        function: {
          handler: "services/functions/form/get.main",
          bind: [templateTable, formTable]
        }
      },
      "POST  /forms": {
        function: {
          handler: "services/functions/form/create.main",
          permissions: [cognitoReadonlyAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId
          },
          bind: [formTable]
        }
      },
      "PUT   /forms/{formId}": {
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
      "GET   /templates/{templateId}/forms": {
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
          bind: [tenantTable]
        }
      },
      "GET /users": {
        function: {
          handler: "services/functions/user/list.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
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
  api.attachPermissionsToRoute("GET /docs/{docId}", ["s3"]);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL0F1dGhBbmRBcGlTdGFjay5qcyIsICJzdGFja3MvU3RvcmFnZVN0YWNrLmpzIiwgInNlcnZpY2VzL3V0aWwvY29uc3RhbnRzLmpzIiwgInN0YWNrcy9Gcm9udGVuZFN0YWNrLmpzIiwgInNzdC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29nbml0b1wiO1xyXG5cclxuaW1wb3J0IHsgQ29nbml0bywgQXBpLCB1c2UgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vU3RvcmFnZVN0YWNrXCI7XHJcbmltcG9ydCB7IEFETUlOX0dST1VQLCBUT1BfTEVWRUxfQURNSU5fR1JPVVAgfSBmcm9tIFwiLi4vc2VydmljZXMvdXRpbC9jb25zdGFudHNcIjtcclxuaW1wb3J0IHsgU3RyaW5nQXR0cmlidXRlIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1jb2duaXRvXCI7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEF1dGhBbmRBcGlTdGFjayh7IHN0YWNrLCBhcHAgfSkge1xyXG4gIGNvbnN0IHtcclxuICAgIGJ1Y2tldCxcclxuICAgIGZvcm1UYWJsZSxcclxuICAgIHRlbXBsYXRlVGFibGUsXHJcbiAgICB0ZW5hbnRUYWJsZSxcclxuICAgIGlzb1RhYmxlLFxyXG4gICAgZG9jVGFibGUsXHJcbiAgfSA9IHVzZShTdG9yYWdlU3RhY2spO1xyXG5cclxuICAvLyBDcmVhdGUgYSBDb2duaXRvIFVzZXIgUG9vbCBhbmQgSWRlbnRpdHkgUG9vbFxyXG4gIGNvbnN0IHRlbmFudEF0dHJpYnV0ZSA9IG5ldyBTdHJpbmdBdHRyaWJ1dGUoe1xyXG4gICAgbmFtZTogJ2N1c3RvbTp0ZW5hbnQnLFxyXG4gICAgbXV0YWJsZTogZmFsc2UsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGF1dGggPSBuZXcgQ29nbml0byhzdGFjaywgXCJBdXRoXCIsIHtcclxuICAgIGxvZ2luOiBbXCJlbWFpbFwiXSxcclxuICAgIGNkazoge1xyXG4gICAgICB1c2VyUG9vbDoge1xyXG4gICAgICAgIGN1c3RvbUF0dHJpYnV0ZXM6IHtcclxuICAgICAgICAgIHRlbmFudDogdGVuYW50QXR0cmlidXRlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBcclxuXHJcbiAgY29uc3QgdG9wTGV2ZWxBZG1pbnNHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAoXHJcbiAgICBzdGFjaywgLy8gdGhpc1xyXG4gICAgXCJUb3BMZXZlbEFkbWluc1wiLFxyXG4gICAge1xyXG4gICAgICBncm91cE5hbWU6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCxcclxuICAgICAgdXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgfVxyXG4gICk7ICBcclxuICBjb25zdCBhZG1pbnNHcm91cCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAoXHJcbiAgICBzdGFjaywgLy8gdGhpc1xyXG4gICAgXCJBZG1pbnNcIixcclxuICAgIHtcclxuICAgICAgZ3JvdXBOYW1lOiBBRE1JTl9HUk9VUCxcclxuICAgICAgdXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgfVxyXG4gICk7XHJcblxyXG5cclxuXHJcbiAgY29uc3QgYWRtaW5Vc2VybmFtZSA9IHByb2Nlc3MuZW52LkFETUlOX1VTRVJOQU1FO1xyXG5cclxuICBjb25zdCBhZG1pblVzZXIgPSBuZXcgY29nbml0by5DZm5Vc2VyUG9vbFVzZXIoc3RhY2ssIFwiQWRtaW5Vc2VyXCIsIHtcclxuICAgIHVzZXJQb29sSWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgIHVzZXJuYW1lOiBhZG1pblVzZXJuYW1lLFxyXG4gICAgZGVzaXJlZERlbGl2ZXJ5TWVkaXVtczogW1wiRU1BSUxcIl0sIFxyXG4gICAgZm9yY2VBbGlhc0NyZWF0aW9uOiB0cnVlLFxyXG4gICAgdXNlckF0dHJpYnV0ZXM6IFtcclxuICAgICAgeyBuYW1lOiBcImVtYWlsXCIsIHZhbHVlOiBwcm9jZXNzLmVudi5BRE1JTl9FTUFJTCB9LFxyXG4gICAgICB7IG5hbWU6IFwiY3VzdG9tOnRlbmFudFwiLCB2YWx1ZTogXCJpc29jbG91ZFwiIH0sXHJcbiAgICBdLFxyXG5cclxuICB9KTtcclxuICAvLyBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAvLyBjb25zdCBhZG1pbkdyb3VwTWVtYmVyc2hpcCA9IG5ldyBjb2duaXRvLkNmblVzZXJQb29sVXNlclRvR3JvdXBBdHRhY2htZW50KFxyXG4gIC8vICAgc3RhY2ssXHJcbiAgLy8gICBcIkFkbWluVXNlclRvVG9wTGV2ZWxBZG1pbnNcIixcclxuICAvLyAgIHtcclxuICAvLyAgICAgZ3JvdXBOYW1lOiB0b3BMZXZlbEFkbWluc0dyb3VwLmdyb3VwTmFtZSxcclxuICAvLyAgICAgdXNlcm5hbWU6IGFkbWluVXNlci51c2VybmFtZSxcclxuICAvLyAgICAgdXNlclBvb2xJZDogYXV0aC51c2VyUG9vbElkLFxyXG4gIC8vICAgICBkZXBlbmRzT246IFthZG1pblVzZXIsIHRvcExldmVsQWRtaW5zR3JvdXBdXHJcbiAgLy8gICB9XHJcbiAgICBcclxuICAvLyApO1xyXG4gIC8vIH0sICA1MDAwKTsgLy8gd2FpdCBmb3IgNSBzZWNvbmQgYmVmb3JlIGFkZGluZyB0aGUgdXNlciB0byB0aGUgZ3JvdXBcclxuXHJcblxyXG4gIGNvbnN0IGNvZ25pdG9BY2Nlc3NQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICBhY3Rpb25zOiBbXCJjb2duaXRvLWlkcDoqXCJdLFxyXG4gICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgcmVzb3VyY2VzOiBbXHJcbiAgICAgIGBhcm46YXdzOmNvZ25pdG8taWRwOiR7YXBwLnJlZ2lvbn06JHthcHAuYWNjb3VudH06dXNlcnBvb2wvJHthdXRoLnVzZXJQb29sSWR9YCxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG4gICAgY29uc3QgY29nbml0b1JlYWRvbmx5QWNjZXNzUG9saWN5ID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgYWN0aW9uczogW1wiY29nbml0by1pZHA6RGVzY3JpYmUqXCIsIFwiY29nbml0by1pZHA6QWRtaW5HZXRVc2VyXCJdLFxyXG4gICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgcmVzb3VyY2VzOiBbXHJcbiAgICAgIGBhcm46YXdzOmNvZ25pdG8taWRwOiR7YXBwLnJlZ2lvbn06JHthcHAuYWNjb3VudH06dXNlcnBvb2wvJHthdXRoLnVzZXJQb29sSWR9YCxcclxuICAgIF0sXHJcbiAgfSk7XHJcbiAgLy8gQ3JlYXRlIHRoZSBBUElcclxuICBjb25zdCBhcGkgPSBuZXcgQXBpKHN0YWNrLCBcIkFwaVwiLCB7XHJcbiAgICBjb3JzOiB0cnVlLFxyXG4gICAgYXV0aG9yaXplcnM6IHtcclxuICAgICAgand0OiB7XHJcbiAgICAgICAgdHlwZTogXCJ1c2VyX3Bvb2xcIixcclxuICAgICAgICB1c2VyUG9vbDoge1xyXG4gICAgICAgICAgaWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgIGNsaWVudElkczogW2F1dGgudXNlclBvb2xDbGllbnRJZF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBjdXN0b21Eb21haW46IGFwcC5zdGFnZSA9PT0gXCJwcm9kXCIgPyBgYXBpLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAgOiBhcHAuc3RhZ2UgPT09IFwic3RnXCIgPyBgYXBpLnN0Zy4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gIDogdW5kZWZpbmVkLFxyXG4gICAgY3VzdG9tRG9tYWluOiBhcHAuc3RhZ2UgPT09IFwicHJvZFwiID8gYGFwaS4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gIDogdW5kZWZpbmVkLFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgYXV0aG9yaXplcjogXCJqd3RcIixcclxuICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgRk9STV9UQUJMRTogZm9ybVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIFRFTVBMQVRFX1RBQkxFOiB0ZW1wbGF0ZVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIFRFTkFOVF9UQUJMRTogdGVuYW50VGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgSVNPX1RBQkxFOiBpc29UYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBET0NfVEFCTEU6IGRvY1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIEJVQ0tFVDogYnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICByb3V0ZXM6IHtcclxuICAgICAgXCJQT1NUIC9kb2NzL3VwbG9hZC11cmxcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvZ2V0VXJsRm9yUHV0Lm1haW5cIixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvZG9jc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9saXN0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtkb2NUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL2RvY3Mve2RvY0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2RvY1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgL2RvY3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtkb2NUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgL2RvY3Mve2RvY0lkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2RvYy9kZWxldGUubWFpblwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBcclxuXHJcbiAgICAgIFwiR0VUICAgL2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS9saXN0Lm1haW5cIixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC9mb3Jtcy97Zm9ybUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlLCBmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgL2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvUmVhZG9ubHlBY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvZm9ybXMve2Zvcm1JZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9mb3JtL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9SZWFkb25seUFjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBiaW5kOiBbZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvdGVtcGxhdGVzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZSwgZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlLCBmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgIC90ZW1wbGF0ZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUICAgL3RlbXBsYXRlcy97dGVtcGxhdGVJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3RlbXBsYXRlcy97dGVtcGxhdGVJZH0vZm9ybXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW1wbGF0ZS9saXN0Rm9ybXMubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIC8vIGZvciBub3cganVzdCBzdXBwb3J0IG9uZSB0b3AgbGV2ZWwgaXNvXHJcbiAgICAgIFwiR0VUICAgL2lzb3MvdG9wLWxldmVsXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvaXNvL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbaXNvVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIGZvciBub3cganVzdCBzdXBwb3J0IG9uZSB0b3AgbGV2ZWwgcHJvY2Vzc1xyXG4gICAgICBcIlBVVCAgIC9pc29zL3RvcC1sZXZlbFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2lzby91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2lzb1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuXHJcbiAgICAgIFwiR0VUICAgL3RlbmFudHNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUICAgL3RlbmFudHMve3RlbmFudElkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgICAvdGVuYW50c1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAgIC90ZW5hbnRzL3t0ZW5hbnRJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJERUxFVEUgICAvdGVuYW50cy97dGVuYW50SWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2RlbGV0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFxyXG4gICAgICBcIkdFVCAgIC9teXRlbmFudFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9nZXRteXRlbmFudC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9saXN0Lm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVBcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgL3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgIFxyXG5cclxuICAgICB9LFxyXG4gIH0pO1xyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIlBPU1QgL2RvY3MvdXBsb2FkLXVybFwiLCBbXCJzM1wiXHJcbiAgICAvLyBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAvLyAgIGFjdGlvbnM6IFtcInMzOipcIl0sXHJcbiAgICAvLyAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgIC8vICAgcmVzb3VyY2VzOiBbXHJcbiAgICAvLyAgICAgYnVja2V0LmJ1Y2tldEFybixcclxuICAgIC8vICAgICBidWNrZXQuYnVja2V0QXJuICsgXCIvKlwiLFxyXG4gICAgLy8gICAgIC8vIGJ1Y2tldC5idWNrZXRBcm4gKyBcIi9wcml2YXRlLyR7Y29nbml0by1pZGVudGl0eS5hbWF6b25hd3MuY29tOmN1c3RvbTp0ZW5hbnR9LypcIixcclxuICAgIC8vICAgXSxcclxuICAgIC8vIH0pLFxyXG4gIF0pO1xyXG4gIGFwaS5hdHRhY2hQZXJtaXNzaW9uc1RvUm91dGUoXCJHRVQgL2RvY3Mve2RvY0lkfVwiLCBbXCJzM1wiXSk7XHJcblxyXG5cclxuICBhdXRoLmF0dGFjaFBlcm1pc3Npb25zRm9yQXV0aFVzZXJzKGF1dGgsIFtcclxuICAgIC8vIEFsbG93IGFjY2VzcyB0byB0aGUgQVBJXHJcbiAgICBhcGksXHJcblxyXG4gICAgIC8vIFBvbGljeSBncmFudGluZyBhY2Nlc3MgdG8gYSBzcGVjaWZpYyBmb2xkZXIgaW4gdGhlIGJ1Y2tldFxyXG4gICAgIC8vIHRoaXMgaXMgbm9uIHNlbnNpdGl2ZSBmaWxlcyBzdWNoIGFzIGxvZ29zXHJcbiAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICBhY3Rpb25zOiBbXCJzMzoqXCJdLFxyXG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgIHJlc291cmNlczogW1xyXG4gICAgICAgIGJ1Y2tldC5idWNrZXRBcm4gKyBcIi9wdWJsaWMvKlwiLFxyXG4gICAgICBdLFxyXG4gICAgfSksXHJcbiAgXSk7XHJcbiAgXHJcbiBcclxuIFxyXG4gXHJcblxyXG4gIFxyXG5cclxuXHJcbiAgLy8gU2hvdyB0aGUgYXV0aCByZXNvdXJjZXMgaW4gdGhlIG91dHB1dFxyXG4gIHN0YWNrLmFkZE91dHB1dHMoe1xyXG4gICAgQWNjb3VudDogYXBwLmFjY291bnQsXHJcbiAgICBSZWdpb246IGFwcC5yZWdpb24sXHJcbiAgICBVc2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICBJZGVudGl0eVBvb2xJZDogYXV0aC5jb2duaXRvSWRlbnRpdHlQb29sSWQsXHJcbiAgICBVc2VyUG9vbENsaWVudElkOiBhdXRoLnVzZXJQb29sQ2xpZW50SWQsXHJcbiAgICBBcGlFbmRwb2ludDogYXBpLmN1c3RvbURvbWFpblVybCB8fCBhcGkudXJsLFxyXG4gIH0pO1xyXG4gIC8vIFJldHVybiB0aGUgYXV0aCByZXNvdXJjZVxyXG4gIHJldHVybiB7XHJcbiAgICBhdXRoLFxyXG4gICAgYXBpLFxyXG4gIH07XHJcbn1cclxuIiwgImltcG9ydCB7IEJ1Y2tldCwgVGFibGUgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgY3IgZnJvbSAnYXdzLWNkay1saWIvY3VzdG9tLXJlc291cmNlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gU3RvcmFnZVN0YWNrKHsgc3RhY2ssIGFwcCB9KSB7XHJcbiAgLy8gQ3JlYXRlIGFuIFMzIGJ1Y2tldFxyXG5cclxuICBjb25zdCBidWNrZXQgPSBuZXcgQnVja2V0KHN0YWNrLCBcIlVwbG9hZHNcIiAsIHtcclxuICAgIGNvcnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIG1heEFnZTogXCIxIGRheVwiLFxyXG4gICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbXCIqXCJdLFxyXG4gICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbXCIqXCJdLFxyXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBbXCJHRVRcIiwgXCJQVVRcIiwgXCJQT1NUXCIsIFwiREVMRVRFXCIsIFwiSEVBRFwiXSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG5cclxuXHJcbiAgY29uc3QgdGVuYW50VGFibGUgPSBuZXcgVGFibGUoc3RhY2ssIFwiVGVuYW50XCIsIHtcclxuICAgIGZpZWxkczoge1xyXG4gICAgICB0ZW5hbnRJZDogXCJzdHJpbmdcIixcclxuICAgIH0sXHJcbiAgICBwcmltYXJ5SW5kZXg6IHsgcGFydGl0aW9uS2V5OiBcInRlbmFudElkXCIgfSxcclxuXHJcbiAgfSk7XHJcblxyXG4gXHJcbiAgY29uc3QgaXNvVGFibGUgPSBuZXcgVGFibGUoc3RhY2sgLCBcIklzb1wiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICBpc29JZDogXCJzdHJpbmdcIiwgLy8gdW5pcXVlIGlkIG9mIHRoaXMgY3VzdG9taXNlZCB0ZW1wbGF0ZVxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiaXNvSWRcIiB9LCBcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZm9ybVRhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJGb3JtXCIsIHsgXHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICBmb3JtSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiZm9ybUlkXCIgfSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgdGVtcGxhdGVUYWJsZSA9IG5ldyBUYWJsZShzdGFjayAsIFwiVGVtcGxhdGVcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgdGVtcGxhdGVJZDogXCJzdHJpbmdcIiwgXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJ0ZW1wbGF0ZUlkXCIgfSxcclxuICB9KTtcclxuXHJcblxyXG4gIGNvbnN0IGRvY1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJEb2NcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgZG9jSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiZG9jSWRcIiB9LFxyXG4gIH0pO1xyXG5cclxuXHJcblxyXG4gIC8vIFJldHVybiB0aGUgYnVja2V0IGFuZCB0YWJsZSByZXNvdXJjZXNcclxuICByZXR1cm4ge1xyXG4gICAgdGVuYW50VGFibGUsXHJcbiAgICBpc29UYWJsZSxcclxuICAgIGZvcm1UYWJsZSxcclxuICAgIHRlbXBsYXRlVGFibGUsXHJcbiAgICBkb2NUYWJsZSxcclxuICAgIGJ1Y2tldCxcclxuICB9O1xyXG59IiwgImV4cG9ydCBjb25zdCBUT1BfTEVWRUxfQURNSU5fR1JPVVAgPSAndG9wLWxldmVsLWFkbWlucyc7XHJcbmV4cG9ydCBjb25zdCBBRE1JTl9HUk9VUCA9ICdhZG1pbnMnO1xyXG4iLCAiaW1wb3J0IHsgU3RhdGljU2l0ZSwgdXNlIH0gZnJvbSBcInNzdC9jb25zdHJ1Y3RzXCI7XHJcbi8vIGltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSBcIi4vQXBpU3RhY2tcIjtcclxuLy8gaW1wb3J0IHsgQXV0aFN0YWNrIH0gZnJvbSBcIi4vQXV0aFN0YWNrXCI7XHJcbmltcG9ydCB7IEF1dGhBbmRBcGlTdGFjayB9IGZyb20gXCIuL0F1dGhBbmRBcGlTdGFja1wiO1xyXG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tIFwiLi9TdG9yYWdlU3RhY2tcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGcm9udGVuZFN0YWNrKHsgc3RhY2ssIGFwcCB9KSB7XHJcbiAgY29uc3QgeyBhcGksIGF1dGggfSA9IHVzZShBdXRoQW5kQXBpU3RhY2spO1xyXG4gIGNvbnN0IHsgYnVja2V0IH0gPSB1c2UoU3RvcmFnZVN0YWNrKTtcclxuICAvLyBEZWZpbmUgb3VyIFJlYWN0IGFwcFxyXG4gIGNvbnN0IHNpdGUgPSBuZXcgU3RhdGljU2l0ZShzdGFjaywgXCJSZWFjdFNpdGVcIiwge1xyXG4gICAgY3VzdG9tRG9tYWluOlxyXG4gICAgICBhcHAuc3RhZ2UgPT09IFwicHJvZFwiXHJcbiAgICAgICAgPyB7XHJcbiAgICAgICAgICAgIGRvbWFpbk5hbWU6IGAke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgICAgICBkb21haW5BbGlhczogYHd3dy4ke3Byb2Nlc3MuZW52LkRPTUFJTn1gLFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIC8vIDogXHJcbiAgICAgICAgLy8gYXBwLnN0YWdlID09PSBcInN0Z1wiXHJcbiAgICAgICAgLy8gPyB7XHJcbiAgICAgICAgLy8gICBkb21haW5OYW1lOiBgc3RnLiR7cHJvY2Vzcy5lbnYuRE9NQUlOfWAsXHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIDogXHJcbiAgICAgICAgdW5kZWZpbmVkLFxyXG5cclxuICAgIHBhdGg6IFwiZnJvbnRlbmRcIixcclxuICAgIGJ1aWxkQ29tbWFuZDogXCJucG0gcnVuIGJ1aWxkXCIsIC8vIG9yIFwieWFybiBidWlsZFwiXHJcbiAgICBidWlsZE91dHB1dDogXCJidWlsZFwiLFxyXG4gICAgLy8gUGFzcyBpbiBvdXIgZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBSRUFDVF9BUFBfQVBJX1VSTDogYXBpLmN1c3RvbURvbWFpblVybCB8fCBhcGkudXJsLFxyXG4gICAgICBSRUFDVF9BUFBfUkVHSU9OOiBhcHAucmVnaW9uLFxyXG4gICAgICBSRUFDVF9BUFBfQlVDS0VUOiBidWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgUkVBQ1RfQVBQX1VTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICBSRUFDVF9BUFBfSURFTlRJVFlfUE9PTF9JRDogYXV0aC5jb2duaXRvSWRlbnRpdHlQb29sSWQsXHJcbiAgICAgIFJFQUNUX0FQUF9VU0VSX1BPT0xfQ0xJRU5UX0lEOiBhdXRoLnVzZXJQb29sQ2xpZW50SWQsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG4gIC8vIFNob3cgdGhlIHVybCBpbiB0aGUgb3V0cHV0XHJcbiAgc3RhY2suYWRkT3V0cHV0cyh7XHJcbiAgICBTaXRlVXJsOiBzaXRlLmN1c3RvbURvbWFpblVybCB8fCBzaXRlLnVybCB8fCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLFxyXG4gIH0pO1xyXG59XHJcbiIsICJcbmltcG9ydCB0eXBlIHsgU1NUQ29uZmlnIH0gZnJvbSBcInNzdFwiXG5pbXBvcnQgeyBBdXRoQW5kQXBpU3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvQXV0aEFuZEFwaVN0YWNrLmpzXCJcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9TdG9yYWdlU3RhY2suanNcIlxuaW1wb3J0IHsgRnJvbnRlbmRTdGFjayB9IGZyb20gXCIuL3N0YWNrcy9Gcm9udGVuZFN0YWNrLmpzXCJcblxuZXhwb3J0IGRlZmF1bHQge1xuICBjb25maWcoaW5wdXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogXCJzdXBwbGl4XCIsXG4gICAgICByZWdpb246IFwiYXAtc291dGhlYXN0LTJcIixcbiAgICB9XG4gIH0sXG4gIHN0YWNrcyhhcHApIHtcbiAgICBhcHAuc2V0RGVmYXVsdEZ1bmN0aW9uUHJvcHMoe1xuICAgICAgcnVudGltZTogXCJub2RlanMxNi54XCIsXG4gICAgICBhcmNoaXRlY3R1cmU6IFwiYXJtXzY0XCIsXG4gICAgfSlcblxuICAgIGFwcFxuICAgICAgLnN0YWNrKFN0b3JhZ2VTdGFjaykgIFxuICAgICAgLnN0YWNrKEF1dGhBbmRBcGlTdGFjaylcbiAgICAgIC5zdGFjayhGcm9udGVuZFN0YWNrKVxuICB9LFxufSBzYXRpc2ZpZXMgU1NUQ29uZmlnIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFBQSxZQUFZLFNBQVM7QUFDckIsWUFBWSxhQUFhO0FBRXpCLFNBQVMsU0FBUyxLQUFLLFdBQVc7OztBQ0hsQyxTQUFTLFFBQVEsYUFBYTtBQUM5QixZQUFZLFNBQVM7QUFDckIsWUFBWSxRQUFRO0FBRWIsU0FBUyxhQUFhLEVBQUUsT0FBTyxJQUFJLEdBQUc7QUFHM0MsUUFBTSxTQUFTLElBQUksT0FBTyxPQUFPLFdBQVk7QUFBQSxJQUMzQyxNQUFNO0FBQUEsTUFDSjtBQUFBLFFBQ0UsUUFBUTtBQUFBLFFBQ1IsZ0JBQWdCLENBQUMsR0FBRztBQUFBLFFBQ3BCLGdCQUFnQixDQUFDLEdBQUc7QUFBQSxRQUNwQixnQkFBZ0IsQ0FBQyxPQUFPLE9BQU8sUUFBUSxVQUFVLE1BQU07QUFBQSxNQUN6RDtBQUFBLElBQ0Y7QUFBQSxFQUNGLENBQUM7QUFJRCxRQUFNLGNBQWMsSUFBSSxNQUFNLE9BQU8sVUFBVTtBQUFBLElBQzdDLFFBQVE7QUFBQSxNQUNOLFVBQVU7QUFBQSxJQUNaO0FBQUEsSUFDQSxjQUFjLEVBQUUsY0FBYyxXQUFXO0FBQUEsRUFFM0MsQ0FBQztBQUdELFFBQU0sV0FBVyxJQUFJLE1BQU0sT0FBUSxPQUFPO0FBQUEsSUFDeEMsUUFBUTtBQUFBLE1BQ04sUUFBUTtBQUFBLE1BQ1IsT0FBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLGNBQWMsRUFBRSxjQUFjLFVBQVUsU0FBUyxRQUFRO0FBQUEsRUFDM0QsQ0FBQztBQUVELFFBQU0sWUFBWSxJQUFJLE1BQU0sT0FBUSxRQUFRO0FBQUEsSUFDMUMsUUFBUTtBQUFBLE1BQ04sUUFBUTtBQUFBLE1BQ1IsUUFBUTtBQUFBLElBQ1Y7QUFBQSxJQUNBLGNBQWMsRUFBRSxjQUFjLFVBQVUsU0FBUyxTQUFTO0FBQUEsRUFDNUQsQ0FB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
