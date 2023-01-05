import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Cognito, Api, use } from "@serverless-stack/resources";

import { StorageStack } from "./StorageStack";


export function MyStack({ stack, app }) {
  
  const { bucket, table, customerTable, customerISOTable } = use(StorageStack);

  // Create a Cognito User Pool and Identity Pool
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
  });

  const topLevelAdminsGroup = new cognito.CfnUserPoolGroup(this, 'TopLevelAdmins', {
    groupName: 'top-level-admins',
    userPoolId: auth.userPoolId
  }); 


   // Create the API
   const api = new Api(stack, "Api", {
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
        permissions: [table, customerTable, customerISOTable], // TODO give permissions only to the endpoints that need it
        environment: {
          TABLE_NAME: table.tableName,
          CUSTOMER_TABLE: customerTable.tableName,
          CUSTOMER_ISO_TABLE: customerISOTable.tableName,
        },
      },
    },
    routes: {
      "POST   /notes": "functions/create.main", 
      "GET /notes": "functions/list.main",
      "GET /notes/{id}": "functions/get.main",
      "PUT /notes/{id}": "functions/update.main",
      "DELETE /notes/{id}": "functions/delete.main",

      "GET /customers": "functions/customer/list.main",
      "POST   /customers": "functions/customer/create.main",
      "GET /customers/{id}": "functions/customer/get.main",
      "PUT /customers/{id}": "functions/customer/update.main",
      // "DELETE /customers/{id}": "functions/customer/delete.main",

      "POST   /customers/{customerId}/iso": "functions/customerISO/create.main",

    },
  });

  
  auth.attachPermissionsForAuthUsers(auth, [
    // Allow access to the API
    api,
    
    // Policy granting access to a specific folder in the bucket
    new iam.PolicyStatement({
      actions: ["s3:*"],
      effect: iam.Effect.ALLOW,
      resources: [
        bucket.bucketArn + "/private/${cognito-identity.amazonaws.com:sub}/*",
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
    api
  };
}





