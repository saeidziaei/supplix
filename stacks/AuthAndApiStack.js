import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Cognito, Api, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP, WORKSPACE_OWNER_ROLE } from "../services/util/constants";
import { StringAttribute } from "aws-cdk-lib/aws-cognito";


export function AuthAndApiStack({ stack, app }) {
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
    deletedArchiveTable,
  } = use(StorageStack);

  // Create a Cognito User Pool and Identity Pool
  const tenantAttribute = new StringAttribute({
    name: 'custom:tenant',
    mutable: false,
  });

  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
    cdk: {
      userPool: {
        customAttributes: {
          tenant: tenantAttribute,
        },
      },
      emailSettings: {
        fromEmail: "noreply@isocloud.com.au", // Customize the "from" email address
        replyToEmail: "noreply@isocloud.com.au", // Customize the reply-to email address
        emailSubject: "Welcome to ISO Cloud", // Customize the subject of the email
        verificationMessage: "Your verification code is {####}", // Customize the verification message
        welcomeMessage: "Welcome to ISO Cloud! Your username is {username}", // Customize the welcome message
        passwordResetMessage: "Your password reset code is {####}", // Customize the password reset message
      },
      
    },
  });

  

  const topLevelAdminsGroup = new cognito.CfnUserPoolGroup(
    stack, // this
    "TopLevelAdmins",
    {
      groupName: TOP_LEVEL_ADMIN_GROUP,
      userPoolId: auth.userPoolId,
    }
  );  
  const adminsGroup = new cognito.CfnUserPoolGroup(
    stack, // this
    "Admins",
    {
      groupName: ADMIN_GROUP,
      userPoolId: auth.userPoolId,
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
      { name: "custom:tenant", value: "isocloud" },
    ],

  });



  const cognitoAccessPolicy = new iam.PolicyStatement({
    actions: ["cognito-idp:*"],
    effect: iam.Effect.ALLOW,
    resources: [
      `arn:aws:cognito-idp:${app.region}:${app.account}:userpool/${auth.userPoolId}`,
    ],
  });

    const cognitoReadonlyAccessPolicy = new iam.PolicyStatement({
    actions: ["cognito-idp:Describe*", "cognito-idp:AdminGetUser"],
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
    // customDomain: app.stage === "prod" ? `api.${process.env.DOMAIN}` : app.stage === "stg" ? `api.stg.${process.env.DOMAIN}` : undefined,
    customDomain:
      app.stage === "prod" ? `api.${process.env.DOMAIN}` : undefined,
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
          DELETEDARCHIVE_TABLE: deletedArchiveTable.tableName,
          BUCKET: bucket.bucketName,
        },
        permissions: [workspaceUserTable],
      },
    },
    routes: {
      "GET   /workspaces": {
        function: {
          handler: "services/functions/workspace/list.main",
          bind: [workspaceTable],
        },
      },
      "GET   /workspaces/{workspaceId}": {
        function: {
          handler: "services/functions/workspace/get.main",
          bind: [workspaceTable],
        },
      },
      "POST   /workspaces": {
        function: {
          handler: "services/functions/workspace/create.main",
          bind: [workspaceTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "PUT   /workspaces/{workspaceId}": {
        function: {
          handler: "services/functions/workspace/update.main",
          bind: [workspaceTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "DELETE   /workspaces/{workspaceId}": {
        function: {
          handler: "services/functions/workspace/delete.main",
          bind: [workspaceTable, deletedArchiveTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "GET   /myworkspaces": {
        function: {
          handler: "services/functions/workspacemember/getmyworkspaces.main",
          bind: [workspaceTable],
        },
      },
      "GET   /workspaces/{workspaceId}/members": {
        function: {
          handler: "services/functions/workspacemember/list.main",
          bind: [workspaceUserTable],
        },
      },
      "POST  /workspaces/{workspaceId}/members": {
        function: {
          handler: "services/functions/workspacemember/create.main",
          bind: [workspaceUserTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE,
          },
        },
      },
      "DELETE /workspaces/{workspaceId}/members/{userId}": {
        function: {
          handler: "services/functions/workspacemember/delete.main",
          bind: [workspaceUserTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE,
          },
        },
      },

      "POST /docs/upload-url": {
        function: {
          handler: "services/functions/doc/getUrlForPut.main",
        },
      },
      "GET /workspaces/{workspaceId}/docs": {
        function: {
          handler: "services/functions/doc/list.main",
          bind: [docTable],
        },
      },
      "GET /workspaces/{workspaceId}/docs/{docId}": {
        function: {
          handler: "services/functions/doc/get.main",
          bind: [docTable],
        },
      },
      "POST /workspaces/{workspaceId}/docs": {
        function: {
          handler: "services/functions/doc/create.main",
          bind: [docTable],
        },
      },
      "DELETE /workspaces/{workspaceId}/docs/{docId}": {
        function: {
          handler: "services/functions/doc/delete.main",
          bind: [docTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE,
          },
        },
      },

      "GET   /workspaces/{workspaceId}/forms": {
        function: {
          handler: "services/functions/form/list.main",
        },
      },
      "GET /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/get.main",
          bind: [templateTable, formTable],
        },
      },
      "POST  /workspaces/{workspaceId}/forms": {
        function: {
          handler: "services/functions/form/create.main",
          permissions: [cognitoReadonlyAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
          },
          bind: [formTable],
        },
      },
      "PUT /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/update.main",
          permissions: [cognitoReadonlyAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
          },
          bind: [formTable],
        },
      },
      "DELETE /workspaces/{workspaceId}/forms/{formId}": {
        function: {
          handler: "services/functions/form/delete.main",
          bind: [formTable],
          environment: {
            WORKSPACE_ALLOWED_ROLE: WORKSPACE_OWNER_ROLE,
          },
        },
      },

      "GET   /templates": {
        function: {
          handler: "services/functions/template/list.main",
          bind: [templateTable],
        },
      },
      // templates are not workspace aware but forms are.
      // This endpoint returns form count for the templates so it needs to be workspace aware.
      "GET   /workspaces/{workspaceId}/templates": {
        function: {
          handler: "services/functions/template/listWithFormCount.main",
          bind: [templateTable, formTable],
        },
      },
      "GET   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/get.main",
          bind: [templateTable, formTable],
        },
      },
      "POST   /templates": {
        function: {
          handler: "services/functions/template/create.main",
          bind: [templateTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "PUT   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/update.main",
          bind: [templateTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "GET   /workspaces/{workspaceId}/templates/{templateId}/forms": {
        function: {
          handler: "services/functions/template/listForms.main",
          bind: [formTable],
        },
      },

      // for now just support one top level iso
      "GET   /isos/top-level": {
        function: {
          handler: "services/functions/iso/get.main",
          bind: [isoTable],
        },
      },
      // for now just support one top level process
      "PUT   /isos/top-level": {
        function: {
          handler: "services/functions/iso/update.main",
          bind: [isoTable],
        },
      },

      "GET   /tenants": {
        function: {
          handler: "services/functions/tenant/list.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "GET   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/get.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "POST   /tenants": {
        function: {
          handler: "services/functions/tenant/create.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "PUT   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/update.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "DELETE   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/delete.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },

      "GET   /mytenant": {
        function: {
          handler: "services/functions/tenant/getmytenant.main",
          bind: [tenantTable],
          environment: {},
        },
      },
      "GET /myuser": {
        function: {
          handler: "services/functions/user/get.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
          },
        },
      },

      "GET /users": {
        function: {
          handler: "services/functions/user/list.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            // workspace owners can see the list of users to add/remove them to/from workspace
            // so ALLOWED_GROUPS is not set
          },
        },
      },
      "GET /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/list.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "GET /users/{username}": {
        function: {
          handler: "services/functions/user/get.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "GET /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/get.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "POST /users": {
        function: {
          handler: "services/functions/user/create.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "POST /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/create.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "PUT /users/{username}": {
        function: {
          handler: "services/functions/user/update.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "PUT /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/update.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
      "DELETE /users/{username}": {
        function: {
          handler: "services/functions/user/delete.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "DELETE /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/delete.main",
          bind: [userTable],
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP,
          },
        },
      },
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
  api.attachPermissionsToRoute("GET /workspaces/{workspaceId}/docs/{docId}", ["s3"]);
  api.attachPermissionsToRoute("GET /workspaces/{workspaceId}/forms/{formId}", ["s3"]);
  api.attachPermissionsToRoute("PUT /workspaces/{workspaceId}/forms/{formId}", ["s3"]);
  api.attachPermissionsToRoute("GET /users/{username}", ["s3"]);
  api.attachPermissionsToRoute("GET /users", ["s3"]);
  api.attachPermissionsToRoute("GET /tenants/{tenantId}/users", ["s3"]);
  api.attachPermissionsToRoute("GET /myuser", ["s3"]);
  
  
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
    ApiEndpoint: api.customDomainUrl || api.url,
  });
  // Return the auth resource
  return {
    auth,
    api,
    cognitoAccessPolicy
  };
}
