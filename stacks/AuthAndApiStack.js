import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Cognito, Api, use } from "@serverless-stack/resources";

import { StorageStack } from "./StorageStack";

export function AuthAndApiStack({ stack, app }) {
  const {
    bucket,
    formTable,
    templateTable,
    customerTable,
    customerISOTable,
    processTable,
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
      groupName: "top-level-admins",
      userPoolId: auth.userPoolId,
    }
  );

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
        permissions: [
          formTable,
          templateTable,
          customerTable,
          customerISOTable,
        ], // TODO give permissions only to the endpoints that need it
        environment: {
          FORM_TABLE: formTable.tableName,
          TEMPLATE_TABLE: templateTable.tableName,
          CUSTOMER_TABLE: customerTable.tableName,
          CUSTOMER_ISO_TABLE: customerISOTable.tableName,
          PROCESS_TABLE: processTable.tableName,

          NFORM_TABLE: nformTable.tableName,
          NTEMPLATE_TABLE: ntemplateTable.tableName,
        },
      },
    },
    routes: {
      "GET /customers": "functions/customer/list.main",
      "GET /customers/{customerId}": "functions/customer/get.main",
      "POST   /customers": "functions/customer/create.main",
      "PUT /customers/{customerId}": "functions/customer/update.main",
      // "DELETE /customers/{id}": "functions/customer/delete.main",

      "POST   /customers/{customerId}/iso": "functions/customerISO/create.main",

      "GET   /customer-isos/{customerIsoId}/forms": {
        function: {
          handler: "functions/form/list.main",
          permissions: [formTable],
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

      "GET   /users": {
        function: {
          handler: "functions/user/list.main",
          // permissions: [formTable],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            REGION_ID: app.region,
          },
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

  api.attachPermissionsToRoute("GET /users", [
    new iam.PolicyStatement({
      actions: ["cognito-idp:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        "*",
        // `arn:aws:cognito-idp:${app.region}:${stack.accountId}:userpool/${auth.userPoolId}`,
      ],
    }),
  ]);

  auth.attachPermissionsForAuthUsers(auth, [
    // Allow access to the API
    api,

    // Policy granting access to a specific folder in the bucket
    // TODO: Do we need this?
    new iam.PolicyStatement({
      actions: ["s3:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        bucket.bucketArn,
        bucket.bucketArn + "/public/*", // + "/private/${cognito-identity.amazonaws.com:sub}/*",
      ],
    }),
  ]);
  // Show the auth resources in the output
  stack.addOutputs({
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
