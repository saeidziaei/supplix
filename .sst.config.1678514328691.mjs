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
import { App } from "sst/constructs";
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
  const nformTable = new Table(stack, "NForm", {
    fields: {
      customerId: "string",
      formId: "string"
    },
    primaryIndex: { partitionKey: "customerId", sortKey: "formId" }
  });
  const ntemplateTable = new Table(stack, "NTemplate", {
    fields: {
      customerId: "string",
      templateId: "string"
    },
    primaryIndex: { partitionKey: "customerId", sortKey: "templateId" }
  });
  return {
    tenantTable,
    isoTable,
    formTable,
    templateTable,
    docTable,
    bucket,
    nformTable,
    ntemplateTable
  };
}
__name(StorageStack, "StorageStack");

// services/util/constants.js
var TOP_LEVEL_ADMIN_GROUP = "top-level-admins";
var ADMIN_GROUP = "admins";

// stacks/AuthAndApiStack.js
function AuthAndApiStack({ stack, app }) {
  const {
    bucket,
    formTable,
    templateTable,
    tenantTable,
    isoTable,
    docTable,
    nformTable,
    ntemplateTable
  } = use(StorageStack);
  const auth = new Cognito(stack, "Auth", {
    login: ["email"]
  });
  const topLevelAdminsGroup = new cognito.CfnUserPoolGroup(
    this,
    "TopLevelAdmins",
    {
      groupName: TOP_LEVEL_ADMIN_GROUP,
      userPoolId: auth.userPoolId
    }
  );
  const adminsGroup = new cognito.CfnUserPoolGroup(
    this,
    "Admins",
    {
      groupName: ADMIN_GROUP,
      userPoolId: auth.userPoolId
    }
  );
  const cognitoAccessPolicy = new iam.PolicyStatement({
    actions: ["cognito-idp:*"],
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
    defaults: {
      authorizer: "jwt",
      function: {
        environment: {
          FORM_TABLE: formTable.tableName,
          TEMPLATE_TABLE: templateTable.tableName,
          TENANT_TABLE: tenantTable.tableName,
          ISO_TABLE: isoTable.tableName,
          DOC_TABLE: docTable.tableName,
          BUCKET: bucket.bucketName,
          NFORM_TABLE: nformTable.tableName,
          NTEMPLATE_TABLE: ntemplateTable.tableName
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
          bind: [formTable]
        }
      },
      "PUT   /forms/{formId}": {
        function: {
          handler: "services/functions/form/update.main",
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
      },
      "GET   /customers/{customerId}/forms": {
        function: {
          handler: "services/functions/nform/list.main",
          bind: [nformTable]
        }
      },
      "GET   /customers/{customerId}/nforms/{formId}": {
        function: {
          handler: "services/functions/nform/get.main",
          bind: [ntemplateTable, nformTable]
        }
      },
      "POST   /customers/{customerId}/nforms": {
        function: {
          handler: "services/functions/nform/create.main",
          bind: [nformTable]
        }
      },
      "PUT   /customers/{customerId}/nforms/{formId}": {
        function: {
          handler: "services/functions/nform/update.main",
          bind: [nformTable]
        }
      },
      "GET   /customers/{customerId}/ntemplates": {
        function: {
          handler: "services/functions/ntemplate/list.main",
          bind: [ntemplateTable, nformTable]
        }
      },
      "GET   /customers/{customerId}/ntemplates/{templateId}": {
        function: {
          handler: "services/functions/ntemplate/get.main",
          bind: [ntemplateTable, nformTable]
        }
      },
      "POST   /customers/{customerId}/ntemplates": {
        function: {
          handler: "services/functions/ntemplate/create.main",
          bind: [ntemplateTable]
        }
      },
      "PUT   /customers/{customerId}/ntemplates/{templateId}": {
        function: {
          handler: "services/functions/ntemplate/update.main",
          bind: [ntemplateTable]
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
    ApiEndpoint: api.url
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
    SiteUrl: site.url || "http://localhost:3000"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3RhY2tzL0F1dGhBbmRBcGlTdGFjay5qcyIsICJzdGFja3MvU3RvcmFnZVN0YWNrLmpzIiwgInNlcnZpY2VzL3V0aWwvY29uc3RhbnRzLmpzIiwgInN0YWNrcy9Gcm9udGVuZFN0YWNrLmpzIiwgInNzdC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCAqIGFzIGlhbSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY29nbml0b1wiO1xyXG5cclxuaW1wb3J0IHsgQ29nbml0bywgQXBpLCB1c2UgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgU3RvcmFnZVN0YWNrIH0gZnJvbSBcIi4vU3RvcmFnZVN0YWNrXCI7XHJcbmltcG9ydCB7IEFETUlOX0dST1VQLCBUT1BfTEVWRUxfQURNSU5fR1JPVVAgfSBmcm9tIFwiLi4vc2VydmljZXMvdXRpbC9jb25zdGFudHNcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBBdXRoQW5kQXBpU3RhY2soeyBzdGFjaywgYXBwIH0pIHtcclxuICBjb25zdCB7XHJcbiAgICBidWNrZXQsXHJcbiAgICBmb3JtVGFibGUsXHJcbiAgICB0ZW1wbGF0ZVRhYmxlLFxyXG4gICAgdGVuYW50VGFibGUsXHJcbiAgICBpc29UYWJsZSxcclxuICAgIGRvY1RhYmxlLFxyXG4gICAgbmZvcm1UYWJsZSxcclxuICAgIG50ZW1wbGF0ZVRhYmxlLFxyXG4gIH0gPSB1c2UoU3RvcmFnZVN0YWNrKTtcclxuXHJcbiAgLy8gQ3JlYXRlIGEgQ29nbml0byBVc2VyIFBvb2wgYW5kIElkZW50aXR5IFBvb2xcclxuICBjb25zdCBhdXRoID0gbmV3IENvZ25pdG8oc3RhY2ssIFwiQXV0aFwiLCB7XHJcbiAgICBsb2dpbjogW1wiZW1haWxcIl0sXHJcbiAgfSk7XHJcblxyXG5cclxuICBjb25zdCB0b3BMZXZlbEFkbWluc0dyb3VwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cChcclxuICAgIHRoaXMsXHJcbiAgICBcIlRvcExldmVsQWRtaW5zXCIsXHJcbiAgICB7XHJcbiAgICAgIGdyb3VwTmFtZTogVE9QX0xFVkVMX0FETUlOX0dST1VQLFxyXG4gICAgICB1c2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICB9XHJcbiAgKTsgIFxyXG4gIGNvbnN0IGFkbWluc0dyb3VwID0gbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cChcclxuICAgIHRoaXMsXHJcbiAgICBcIkFkbWluc1wiLFxyXG4gICAge1xyXG4gICAgICBncm91cE5hbWU6IEFETUlOX0dST1VQLFxyXG4gICAgICB1c2VyUG9vbElkOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICB9XHJcbiAgKTtcclxuXHJcbiAgY29uc3QgY29nbml0b0FjY2Vzc1BvbGljeSA9ICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICBhY3Rpb25zOiBbXCJjb2duaXRvLWlkcDoqXCJdLFxyXG4gICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgcmVzb3VyY2VzOiBbXHJcbiAgICAgIGBhcm46YXdzOmNvZ25pdG8taWRwOiR7YXBwLnJlZ2lvbn06JHthcHAuYWNjb3VudH06dXNlcnBvb2wvJHthdXRoLnVzZXJQb29sSWR9YCxcclxuICAgIF0sXHJcbiAgfSk7XHJcbiAgLy8gQ3JlYXRlIHRoZSBBUElcclxuICBjb25zdCBhcGkgPSBuZXcgQXBpKHN0YWNrLCBcIkFwaVwiLCB7XHJcbiAgICBjb3JzOiB0cnVlLFxyXG4gICAgYXV0aG9yaXplcnM6IHtcclxuICAgICAgand0OiB7XHJcbiAgICAgICAgdHlwZTogXCJ1c2VyX3Bvb2xcIixcclxuICAgICAgICB1c2VyUG9vbDoge1xyXG4gICAgICAgICAgaWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgIGNsaWVudElkczogW2F1dGgudXNlclBvb2xDbGllbnRJZF0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICBhdXRob3JpemVyOiBcImp3dFwiLFxyXG4gICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICBGT1JNX1RBQkxFOiBmb3JtVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgVEVNUExBVEVfVEFCTEU6IHRlbXBsYXRlVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgVEVOQU5UX1RBQkxFOiB0ZW5hbnRUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICBJU09fVEFCTEU6IGlzb1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIERPQ19UQUJMRTogZG9jVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgICAgQlVDS0VUOiBidWNrZXQuYnVja2V0TmFtZSxcclxuICAgICAgICAgIE5GT1JNX1RBQkxFOiBuZm9ybVRhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgIE5URU1QTEFURV9UQUJMRTogbnRlbXBsYXRlVGFibGUudGFibGVOYW1lLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcm91dGVzOiB7XHJcbiAgICAgIFwiUE9TVCAvZG9jcy91cGxvYWQtdXJsXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2dldFVybEZvclB1dC5tYWluXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL2RvY3NcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbZG9jVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC9kb2NzL3tkb2NJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtkb2NUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUIC9kb2NzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZG9jL2NyZWF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbZG9jVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiREVMRVRFIC9kb2NzL3tkb2NJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9kb2MvZGVsZXRlLm1haW5cIixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXHJcblxyXG4gICAgICBcIkdFVCAgIC9mb3Jtc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vbGlzdC5tYWluXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvZm9ybXMve2Zvcm1JZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9mb3JtL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZSwgZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgIC9mb3Jtc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2Zvcm0vY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUICAgL2Zvcm1zL3tmb3JtSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvZm9ybS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2Zvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcbiAgICAgIFwiR0VUICAgL3RlbXBsYXRlc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbXBsYXRlL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbXBsYXRlVGFibGUsIGZvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvdGVtcGxhdGVzL3t0ZW1wbGF0ZUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbXBsYXRlL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVtcGxhdGVUYWJsZSwgZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgICAvdGVtcGxhdGVzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC90ZW1wbGF0ZXMve3RlbXBsYXRlSWR9L2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVtcGxhdGUvbGlzdEZvcm1zLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtmb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIGlzb1xyXG4gICAgICBcIkdFVCAgIC9pc29zL3RvcC1sZXZlbFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL2lzby9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW2lzb1RhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyBmb3Igbm93IGp1c3Qgc3VwcG9ydCBvbmUgdG9wIGxldmVsIHByb2Nlc3NcclxuICAgICAgXCJQVVQgICAvaXNvcy90b3AtbGV2ZWxcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9pc28vdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtpc29UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuXHJcblxyXG4gICAgICBcIkdFVCAgIC90ZW5hbnRzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW3RlbmFudFRhYmxlXSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC90ZW5hbnRzL3t0ZW5hbnRJZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvZ2V0Lm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUICAgL3RlbmFudHNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy90ZW5hbnQvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFt0ZW5hbnRUYWJsZV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvdGVuYW50cy97dGVuYW50SWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdGVuYW50L3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcblxyXG4gICAgICBcIkdFVCAgIC9teXRlbmFudFwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3RlbmFudC9nZXRteXRlbmFudC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbdGVuYW50VGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9saXN0Lm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IFRPUF9MRVZFTF9BRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiR0VUIC91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogQURNSU5fR1JPVVBcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgL3RlbmFudHMve3RlbmFudElkfS91c2Vycy97dXNlcm5hbWV9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9nZXQubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQT1NUIC91c2Vyc1wiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL3VzZXIvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbY29nbml0b0FjY2Vzc1BvbGljeV0sXHJcbiAgICAgICAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICAgICAgICBVU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgICAgICAgQUxMT1dFRF9HUk9VUFM6IEFETUlOX0dST1VQXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvdXNlci9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtjb2duaXRvQWNjZXNzUG9saWN5XSxcclxuICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgIFVTRVJfUE9PTF9JRDogYXV0aC51c2VyUG9vbElkLFxyXG4gICAgICAgICAgICBBTExPV0VEX0dST1VQUzogVE9QX0xFVkVMX0FETUlOX0dST1VQXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgL3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBBRE1JTl9HUk9VUFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBVVCAvdGVuYW50cy97dGVuYW50SWR9L3VzZXJzL3t1c2VybmFtZX1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy91c2VyL3VwZGF0ZS5tYWluXCIsXHJcbiAgICAgICAgICBwZXJtaXNzaW9uczogW2NvZ25pdG9BY2Nlc3NQb2xpY3ldLFxyXG4gICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgVVNFUl9QT09MX0lEOiBhdXRoLnVzZXJQb29sSWQsXHJcbiAgICAgICAgICAgIEFMTE9XRURfR1JPVVBTOiBUT1BfTEVWRUxfQURNSU5fR1JPVVBcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgIFxyXG4gICAgICAvLyAjIyMjIyMjIyMjIyMjIyMgIE4gU2VjdG9pbiAjIyMjIyMjIyMjIyMjIyMjIyMjI1xyXG4gICAgICBcIkdFVCAgIC9jdXN0b21lcnMve2N1c3RvbWVySWR9L2Zvcm1zXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvbmZvcm0vbGlzdC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbbmZvcm1UYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJHRVQgICAvY3VzdG9tZXJzL3tjdXN0b21lcklkfS9uZm9ybXMve2Zvcm1JZH1cIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9uZm9ybS9nZXQubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW250ZW1wbGF0ZVRhYmxlLCBuZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIlBPU1QgICAvY3VzdG9tZXJzL3tjdXN0b21lcklkfS9uZm9ybXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9uZm9ybS9jcmVhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW25mb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUFVUICAgL2N1c3RvbWVycy97Y3VzdG9tZXJJZH0vbmZvcm1zL3tmb3JtSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvbmZvcm0vdXBkYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtuZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG5cclxuICAgICAgXCJHRVQgICAvY3VzdG9tZXJzL3tjdXN0b21lcklkfS9udGVtcGxhdGVzXCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvbnRlbXBsYXRlL2xpc3QubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW250ZW1wbGF0ZVRhYmxlLCBuZm9ybVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcIkdFVCAgIC9jdXN0b21lcnMve2N1c3RvbWVySWR9L250ZW1wbGF0ZXMve3RlbXBsYXRlSWR9XCI6IHtcclxuICAgICAgICBmdW5jdGlvbjoge1xyXG4gICAgICAgICAgaGFuZGxlcjogXCJzZXJ2aWNlcy9mdW5jdGlvbnMvbnRlbXBsYXRlL2dldC5tYWluXCIsXHJcbiAgICAgICAgICBiaW5kOiBbbnRlbXBsYXRlVGFibGUsIG5mb3JtVGFibGVdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIFwiUE9TVCAgIC9jdXN0b21lcnMve2N1c3RvbWVySWR9L250ZW1wbGF0ZXNcIjoge1xyXG4gICAgICAgIGZ1bmN0aW9uOiB7XHJcbiAgICAgICAgICBoYW5kbGVyOiBcInNlcnZpY2VzL2Z1bmN0aW9ucy9udGVtcGxhdGUvY3JlYXRlLm1haW5cIixcclxuICAgICAgICAgIGJpbmQ6IFtudGVtcGxhdGVUYWJsZV0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgXCJQVVQgICAvY3VzdG9tZXJzL3tjdXN0b21lcklkfS9udGVtcGxhdGVzL3t0ZW1wbGF0ZUlkfVwiOiB7XHJcbiAgICAgICAgZnVuY3Rpb246IHtcclxuICAgICAgICAgIGhhbmRsZXI6IFwic2VydmljZXMvZnVuY3Rpb25zL250ZW1wbGF0ZS91cGRhdGUubWFpblwiLFxyXG4gICAgICAgICAgYmluZDogW250ZW1wbGF0ZVRhYmxlXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xyXG4gICAgIH0sXHJcbiAgfSk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuICBhcGkuYXR0YWNoUGVybWlzc2lvbnNUb1JvdXRlKFwiUE9TVCAvZG9jcy91cGxvYWQtdXJsXCIsIFtcInMzXCJcclxuICAgIC8vIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgIC8vICAgYWN0aW9uczogW1wiczM6KlwiXSxcclxuICAgIC8vICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgLy8gICByZXNvdXJjZXM6IFtcclxuICAgIC8vICAgICBidWNrZXQuYnVja2V0QXJuLFxyXG4gICAgLy8gICAgIGJ1Y2tldC5idWNrZXRBcm4gKyBcIi8qXCIsXHJcbiAgICAvLyAgICAgLy8gYnVja2V0LmJ1Y2tldEFybiArIFwiL3ByaXZhdGUvJHtjb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb206Y3VzdG9tOnRlbmFudH0vKlwiLFxyXG4gICAgLy8gICBdLFxyXG4gICAgLy8gfSksXHJcbiAgXSk7XHJcbiAgYXBpLmF0dGFjaFBlcm1pc3Npb25zVG9Sb3V0ZShcIkdFVCAvZG9jcy97ZG9jSWR9XCIsIFtcInMzXCJdKTtcclxuXHJcblxyXG4gIGF1dGguYXR0YWNoUGVybWlzc2lvbnNGb3JBdXRoVXNlcnMoYXV0aCwgW1xyXG4gICAgLy8gQWxsb3cgYWNjZXNzIHRvIHRoZSBBUElcclxuICAgIGFwaSxcclxuXHJcbiAgICAgLy8gUG9saWN5IGdyYW50aW5nIGFjY2VzcyB0byBhIHNwZWNpZmljIGZvbGRlciBpbiB0aGUgYnVja2V0XHJcbiAgICAgLy8gdGhpcyBpcyBub24gc2Vuc2l0aXZlIGZpbGVzIHN1Y2ggYXMgbG9nb3NcclxuICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgIGFjdGlvbnM6IFtcInMzOipcIl0sXHJcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgcmVzb3VyY2VzOiBbXHJcbiAgICAgICAgYnVja2V0LmJ1Y2tldEFybiArIFwiL3B1YmxpYy8qXCIsXHJcbiAgICAgIF0sXHJcbiAgICB9KSxcclxuICBdKTtcclxuICBcclxuIFxyXG4gXHJcbiBcclxuXHJcbiAgXHJcblxyXG5cclxuICAvLyBTaG93IHRoZSBhdXRoIHJlc291cmNlcyBpbiB0aGUgb3V0cHV0XHJcbiAgc3RhY2suYWRkT3V0cHV0cyh7XHJcbiAgICBBY2NvdW50OiBhcHAuYWNjb3VudCxcclxuICAgIFJlZ2lvbjogYXBwLnJlZ2lvbixcclxuICAgIFVzZXJQb29sSWQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgIElkZW50aXR5UG9vbElkOiBhdXRoLmNvZ25pdG9JZGVudGl0eVBvb2xJZCxcclxuICAgIFVzZXJQb29sQ2xpZW50SWQ6IGF1dGgudXNlclBvb2xDbGllbnRJZCxcclxuICAgIEFwaUVuZHBvaW50OiBhcGkudXJsLFxyXG4gIH0pO1xyXG4gIC8vIFJldHVybiB0aGUgYXV0aCByZXNvdXJjZVxyXG4gIHJldHVybiB7XHJcbiAgICBhdXRoLFxyXG4gICAgYXBpLFxyXG4gIH07XHJcbn1cclxuIiwgImltcG9ydCB7IEJ1Y2tldCwgVGFibGUgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBBcHAsICB9IGZyb20gXCJzc3QvY29uc3RydWN0c1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFN0b3JhZ2VTdGFjayh7IHN0YWNrLCBhcHAgfSkge1xyXG4gIC8vIENyZWF0ZSBhbiBTMyBidWNrZXRcclxuXHJcbiAgY29uc3QgYnVja2V0ID0gbmV3IEJ1Y2tldChzdGFjaywgXCJVcGxvYWRzXCIgLCB7XHJcbiAgICBjb3JzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBtYXhBZ2U6IFwiMSBkYXlcIixcclxuICAgICAgICBhbGxvd2VkT3JpZ2luczogW1wiKlwiXSxcclxuICAgICAgICBhbGxvd2VkSGVhZGVyczogW1wiKlwiXSxcclxuICAgICAgICBhbGxvd2VkTWV0aG9kczogW1wiR0VUXCIsIFwiUFVUXCIsIFwiUE9TVFwiLCBcIkRFTEVURVwiLCBcIkhFQURcIl0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG5cclxuXHJcblxyXG4gIGNvbnN0IHRlbmFudFRhYmxlID0gbmV3IFRhYmxlKHN0YWNrLCBcIlRlbmFudFwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50SWQ6IFwic3RyaW5nXCIsXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRJZFwiIH0sXHJcbiAgfSk7XHJcbiBcclxuXHJcbiAgY29uc3QgaXNvVGFibGUgPSBuZXcgVGFibGUoc3RhY2sgLCBcIklzb1wiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICBpc29JZDogXCJzdHJpbmdcIiwgLy8gdW5pcXVlIGlkIG9mIHRoaXMgY3VzdG9taXNlZCB0ZW1wbGF0ZVxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiaXNvSWRcIiB9LCBcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZm9ybVRhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJGb3JtXCIsIHsgXHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgdGVuYW50OiBcInN0cmluZ1wiLFxyXG4gICAgICBmb3JtSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiZm9ybUlkXCIgfSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgdGVtcGxhdGVUYWJsZSA9IG5ldyBUYWJsZShzdGFjayAsIFwiVGVtcGxhdGVcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgdGVtcGxhdGVJZDogXCJzdHJpbmdcIiwgXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJ0ZW5hbnRcIiwgc29ydEtleTogXCJ0ZW1wbGF0ZUlkXCIgfSxcclxuICB9KTtcclxuXHJcbiAgLy8gY29uc3QgcHJvY2Vzc1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJQcm9jZXNzXCIsIHtcclxuICAvLyAgIGZpZWxkczoge1xyXG4gIC8vICAgICBjdXN0b21lcklzb0lkOiBcInN0cmluZ1wiLFxyXG4gIC8vICAgICBwcm9jZXNzSWQ6IFwic3RyaW5nXCIsIFxyXG4gIC8vICAgfSxcclxuICAvLyAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwiY3VzdG9tZXJJc29JZFwiLCBzb3J0S2V5OiBcInByb2Nlc3NJZFwiIH0sXHJcbiAgLy8gfSk7XHJcblxyXG4gIGNvbnN0IGRvY1RhYmxlID0gbmV3IFRhYmxlKHN0YWNrICwgXCJEb2NcIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIHRlbmFudDogXCJzdHJpbmdcIixcclxuICAgICAgZG9jSWQ6IFwic3RyaW5nXCIsIFxyXG4gICAgfSxcclxuICAgIHByaW1hcnlJbmRleDogeyBwYXJ0aXRpb25LZXk6IFwidGVuYW50XCIsIHNvcnRLZXk6IFwiZG9jSWRcIiB9LFxyXG4gIH0pO1xyXG5cclxuXHJcbiAgY29uc3QgbmZvcm1UYWJsZSA9IG5ldyBUYWJsZShzdGFjayAsIFwiTkZvcm1cIiwge1xyXG4gICAgZmllbGRzOiB7XHJcbiAgICAgIGN1c3RvbWVySWQ6IFwic3RyaW5nXCIsXHJcbiAgICAgIGZvcm1JZDogXCJzdHJpbmdcIiwgXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJjdXN0b21lcklkXCIsIHNvcnRLZXk6IFwiZm9ybUlkXCIgfSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgbnRlbXBsYXRlVGFibGUgPSBuZXcgVGFibGUoc3RhY2sgLCBcIk5UZW1wbGF0ZVwiLCB7XHJcbiAgICBmaWVsZHM6IHtcclxuICAgICAgY3VzdG9tZXJJZDogXCJzdHJpbmdcIixcclxuICAgICAgdGVtcGxhdGVJZDogXCJzdHJpbmdcIiwgXHJcbiAgICB9LFxyXG4gICAgcHJpbWFyeUluZGV4OiB7IHBhcnRpdGlvbktleTogXCJjdXN0b21lcklkXCIsIHNvcnRLZXk6IFwidGVtcGxhdGVJZFwiIH0sXHJcbiAgfSk7XHJcblxyXG4gIC8vIFJldHVybiB0aGUgYnVja2V0IGFuZCB0YWJsZSByZXNvdXJjZXNcclxuICByZXR1cm4ge1xyXG4gICAgdGVuYW50VGFibGUsXHJcbiAgICBpc29UYWJsZSxcclxuICAgIGZvcm1UYWJsZSxcclxuICAgIHRlbXBsYXRlVGFibGUsXHJcbiAgICBkb2NUYWJsZSxcclxuICAgIGJ1Y2tldCxcclxuICAgIG5mb3JtVGFibGUsXHJcbiAgICBudGVtcGxhdGVUYWJsZVxyXG4gIH07XHJcbn0iLCAiZXhwb3J0IGNvbnN0IFRPUF9MRVZFTF9BRE1JTl9HUk9VUCA9ICd0b3AtbGV2ZWwtYWRtaW5zJztcclxuZXhwb3J0IGNvbnN0IEFETUlOX0dST1VQID0gJ2FkbWlucyc7XHJcbiIsICJpbXBvcnQgeyBTdGF0aWNTaXRlLCB1c2UgfSBmcm9tIFwic3N0L2NvbnN0cnVjdHNcIjtcclxuLy8gaW1wb3J0IHsgQXBpU3RhY2sgfSBmcm9tIFwiLi9BcGlTdGFja1wiO1xyXG4vLyBpbXBvcnQgeyBBdXRoU3RhY2sgfSBmcm9tIFwiLi9BdXRoU3RhY2tcIjtcclxuaW1wb3J0IHsgQXV0aEFuZEFwaVN0YWNrIH0gZnJvbSBcIi4vQXV0aEFuZEFwaVN0YWNrXCI7XHJcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gXCIuL1N0b3JhZ2VTdGFja1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEZyb250ZW5kU3RhY2soeyBzdGFjaywgYXBwIH0pIHtcclxuICBjb25zdCB7IGFwaSwgYXV0aCB9ID0gdXNlKEF1dGhBbmRBcGlTdGFjayk7XHJcbiAgY29uc3QgeyBidWNrZXQgfSA9IHVzZShTdG9yYWdlU3RhY2spO1xyXG4gIC8vIERlZmluZSBvdXIgUmVhY3QgYXBwXHJcbiAgY29uc3Qgc2l0ZSA9IG5ldyBTdGF0aWNTaXRlKHN0YWNrLCBcIlJlYWN0U2l0ZVwiLCB7XHJcbiAgICBwYXRoOiBcImZyb250ZW5kXCIsXHJcbiAgICBidWlsZENvbW1hbmQ6IFwibnBtIHJ1biBidWlsZFwiLCAvLyBvciBcInlhcm4gYnVpbGRcIlxyXG4gICAgYnVpbGRPdXRwdXQ6IFwiYnVpbGRcIixcclxuICAgIC8vIFBhc3MgaW4gb3VyIGVudmlyb25tZW50IHZhcmlhYmxlc1xyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgUkVBQ1RfQVBQX0FQSV9VUkw6IGFwaS5jdXN0b21Eb21haW5VcmwgfHwgYXBpLnVybCxcclxuICAgICAgUkVBQ1RfQVBQX1JFR0lPTjogYXBwLnJlZ2lvbixcclxuICAgICAgUkVBQ1RfQVBQX0JVQ0tFVDogYnVja2V0LmJ1Y2tldE5hbWUsXHJcbiAgICAgIFJFQUNUX0FQUF9VU0VSX1BPT0xfSUQ6IGF1dGgudXNlclBvb2xJZCxcclxuICAgICAgUkVBQ1RfQVBQX0lERU5USVRZX1BPT0xfSUQ6IGF1dGguY29nbml0b0lkZW50aXR5UG9vbElkLFxyXG4gICAgICBSRUFDVF9BUFBfVVNFUl9QT09MX0NMSUVOVF9JRDogYXV0aC51c2VyUG9vbENsaWVudElkLFxyXG4gICAgfSxcclxuICB9KTtcclxuICAvLyBTaG93IHRoZSB1cmwgaW4gdGhlIG91dHB1dFxyXG4gIHN0YWNrLmFkZE91dHB1dHMoe1xyXG4gICAgU2l0ZVVybDogc2l0ZS51cmwgfHwgXCJodHRwOi8vbG9jYWxob3N0OjMwMDBcIixcclxuICB9KTtcclxufVxyXG4iLCAiXG5pbXBvcnQgdHlwZSB7IFNTVENvbmZpZyB9IGZyb20gXCJzc3RcIlxuaW1wb3J0IHsgQXV0aEFuZEFwaVN0YWNrIH0gZnJvbSBcIi4vc3RhY2tzL0F1dGhBbmRBcGlTdGFjay5qc1wiXG5pbXBvcnQgeyBTdG9yYWdlU3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvU3RvcmFnZVN0YWNrLmpzXCJcbmltcG9ydCB7IEZyb250ZW5kU3RhY2sgfSBmcm9tIFwiLi9zdGFja3MvRnJvbnRlbmRTdGFjay5qc1wiXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY29uZmlnKGlucHV0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFwic3VwcGxpeFwiLFxuICAgICAgcmVnaW9uOiBcImFwLXNvdXRoZWFzdC0yXCIsXG4gICAgfVxuICB9LFxuICBzdGFja3MoYXBwKSB7XG4gICAgYXBwLnNldERlZmF1bHRGdW5jdGlvblByb3BzKHtcbiAgICAgIHJ1bnRpbWU6IFwibm9kZWpzMTYueFwiLFxuICAgICAgYXJjaGl0ZWN0dXJlOiBcImFybV82NFwiLFxuICAgIH0pXG5cbiAgICBhcHBcbiAgICAgIC5zdGFjayhTdG9yYWdlU3RhY2spICBcbiAgICAgIC5zdGFjayhBdXRoQW5kQXBpU3RhY2spXG4gICAgICAuc3RhY2soRnJvbnRlbmRTdGFjaylcbiAgfSxcbn0gc2F0aXNmaWVz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
