import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Cognito, Api, use } from "@serverless-stack/resources";
import { StorageStack } from "./StorageStack";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../services/util/constants";

export function AuthAndApiStack({ stack, app }) {
  const {
    bucket,
    formTable,
    templateTable,
    tenantTable,
    customerISOTable,
    processTable,
    docTable,
    nformTable,
    ntemplateTable,
  } = use(StorageStack);

  // Create a Cognito User Pool and Identity Pool
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
  });

  const topLevelAdminsGroup = new cognito.CfnUserPoolGroup(
    this,
    "TopLevelAdmins",
    {
      groupName: TOP_LEVEL_ADMIN_GROUP,
      userPoolId: auth.userPoolId,
    }
  );

  const cognitoAccessPolicy =     new iam.PolicyStatement({
    actions: ["cognito-idp:*"],
    effect: iam.Effect.ALLOW,
    resources: [
      `arn:aws:cognito-idp:${app.region}:${app.account}:userpool/${auth.userPoolId}`,
    ],
  });
  // Create the API
  const api = new Api(stack, "Api", {
    cors: true,
    authorizers: {
      jwt: {
        type: "user_pool",
        userPool: {
          id: auth.userPoolId,
          clientIds: [auth.userPoolClientId],
        },
      },
    },
    defaults: {
      authorizer: "jwt",
      function: {
        environment: {
          FORM_TABLE: formTable.tableName,
          TEMPLATE_TABLE: templateTable.tableName,
          TENANT_TABLE: tenantTable.tableName,
          CUSTOMER_ISO_TABLE: customerISOTable.tableName,
          PROCESS_TABLE: processTable.tableName,
          DOC_TABLE: docTable.tableName,
          BUCKET: bucket.bucketName,
          NFORM_TABLE: nformTable.tableName,
          NTEMPLATE_TABLE: ntemplateTable.tableName,
        },
      },
    },
    routes: {
      "POST /docs/upload-url": {
        function: {
          handler: "functions/doc/getUrlForPut.main",
        },
      },
      "GET /docs": {
        function: {
          handler: "functions/doc/list.main",
          permissions: [docTable],
        },
      },
      "GET /docs/{docId}": {
        function: {
          handler: "functions/doc/get.main",
          permissions: [docTable],
        },
      },
      "POST /docs": {
        function: {
          handler: "functions/doc/create.main",
          permissions: [docTable],
        },
      },
      "DELETE /docs/{docId}": {
        function: {
          handler: "functions/doc/delete.main",
        },
      },

      "POST   /customers/{customerId}/iso": "functions/customerISO/create.main",

      "GET   /customer-isos/{customerIsoId}/forms": {
        function: {
          handler: "functions/form/list.main",
        },
      },
      "GET   /customer-isos/{customerIsoId}/forms/{formId}": {
        function: {
          handler: "functions/form/get.main",
          permissions: [templateTable, formTable],
        },
      },
      "POST   /customer-isos/{customerIsoId}/forms": {
        function: {
          handler: "functions/form/create.main",
          permissions: [formTable],
        },
      },
      "PUT   /customer-isos/{customerIsoId}/forms/{formId}": {
        function: {
          handler: "functions/form/update.main",
          permissions: [formTable],
        },
      },

      "GET   /customer-isos/{customerIsoId}/templates": {
        function: {
          handler: "functions/template/list.main",
          permissions: [templateTable, formTable],
        },
      },
      "GET   /customer-isos/{customerIsoId}/templates/{templateId}": {
        function: {
          handler: "functions/template/get.main",
          permissions: [templateTable, formTable],
        },
      },
      "POST   /customer-isos/{customerIsoId}/templates": {
        function: {
          handler: "functions/template/create.main",
          permissions: [templateTable],
        },
      },
      "PUT   /customer-isos/{customerIsoId}/templates/{templateId}": {
        function: {
          handler: "functions/template/update.main",
          permissions: [templateTable],
        },
      },
      "GET   /customer-isos/{customerIsoId}/templates/{templateId}/forms": {
        function: {
          handler: "functions/template/listForms.main",
          permissions: [formTable],
        },
      },

      // for now just support one top level process
      "GET   /customer-isos/{customerIsoId}/processes/top-level": {
        function: {
          handler: "functions/process/get.main",
          permissions: [processTable],
        },
      },
      // for now just support one top level process
      "PUT   /customer-isos/{customerIsoId}/processes/top-level": {
        function: {
          handler: "functions/process/update.main",
          permissions: [processTable],
        },
      },


      "GET   /tenants": {
        function: {
          handler: "functions/tenant/list.main",
          permissions: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "GET   /tenants/{tenantId}": {
        function: {
          handler: "functions/tenant/get.main",
          permissions: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "POST   /tenants": {
        function: {
          handler: "functions/tenant/create.main",
          permissions: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "PUT   /tenants/{tenantId}": {
        function: {
          handler: "functions/tenant/update.main",
          permissions: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },

      "GET   /mytenant": {
        function: {
          handler: "functions/tenant/getmytenant.main",
          permissions: [tenantTable],
        },
      },
      "GET /users": {
        function: {
          handler: "functions/user/list.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "GET /tenants/{tenantId}/users": {
        function: {
          handler: "functions/user/list.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "GET /users/{username}": {
        function: {
          handler: "functions/user/get.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "GET /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "functions/user/get.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "POST /users": {
        function: {
          handler: "functions/user/create.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "POST /tenants/{tenantId}/users": {
        function: {
          handler: "functions/user/create.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "PUT /users/{username}": {
        function: {
          handler: "functions/user/update.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "PUT /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "functions/user/update.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
     
      // ###############  N Sectoin ####################
      "GET   /customers/{customerId}/forms": {
        function: {
          handler: "functions/nform/list.main",
          permissions: [nformTable],
        },
      },
      "GET   /customers/{customerId}/nforms/{formId}": {
        function: {
          handler: "functions/nform/get.main",
          permissions: [ntemplateTable, nformTable],
        },
      },
      "POST   /customers/{customerId}/nforms": {
        function: {
          handler: "functions/nform/create.main",
          permissions: [nformTable],
        },
      },
      "PUT   /customers/{customerId}/nforms/{formId}": {
        function: {
          handler: "functions/nform/update.main",
          permissions: [nformTable],
        },
      },

      "GET   /customers/{customerId}/ntemplates": {
        function: {
          handler: "functions/ntemplate/list.main",
          permissions: [ntemplateTable, nformTable],
        },
      },
      "GET   /customers/{customerId}/ntemplates/{templateId}": {
        function: {
          handler: "functions/ntemplate/get.main",
          permissions: [ntemplateTable, nformTable],
        },
      },
      "POST   /customers/{customerId}/ntemplates": {
        function: {
          handler: "functions/ntemplate/create.main",
          permissions: [ntemplateTable],
        },
      },
      "PUT   /customers/{customerId}/ntemplates/{templateId}": {
        function: {
          handler: "functions/ntemplate/update.main",
          permissions: [ntemplateTable],
        },
      },
      // ###############################################
    },
  });





  api.attachPermissionsToRoute("POST /docs/upload-url", ["s3"
    // new iam.PolicyStatement({
    //   actions: ["s3:*"],
    //   effect: iam.Effect.ALLOW,
    //   resources: [
    //     bucket.bucketArn,
    //     bucket.bucketArn + "/*",
    //     // bucket.bucketArn + "/private/${cognito-identity.amazonaws.com:custom:tenant}/*",
    //   ],
    // }),
  ]);
  api.attachPermissionsToRoute("GET /docs/{docId}", ["s3"]);


  auth.attachPermissionsForAuthUsers(auth, [
    // Allow access to the API
    api,

     // Policy granting access to a specific folder in the bucket
     // this is non sensitive files such as logos
     new iam.PolicyStatement({
      actions: ["s3:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        bucket.bucketArn + "/public/*",
      ],
    }),
  ]);
  
 
 
 

  


  // Show the auth resources in the output
  stack.addOutputs({
    Account: app.account,
    Region: app.region,
    UserPoolId: auth.userPoolId,
    IdentityPoolId: auth.cognitoIdentityPoolId,
    UserPoolClientId: auth.userPoolClientId,
    ApiEndpoint: api.url,
  });
  // Return the auth resource
  return {
    auth,
    api,
  };
}
