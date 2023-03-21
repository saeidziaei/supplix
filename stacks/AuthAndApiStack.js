import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Cognito, Api, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../services/util/constants";
import { StringAttribute } from "aws-cdk-lib/aws-cognito";


export function AuthAndApiStack({ stack, app }) {
  const {
    bucket,
    formTable,
    templateTable,
    tenantTable,
    isoTable,
    docTable,
    nformTable,
    ntemplateTable,
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
  // setTimeout(() => {
  // const adminGroupMembership = new cognito.CfnUserPoolUserToGroupAttachment(
  //   stack,
  //   "AdminUserToTopLevelAdmins",
  //   {
  //     groupName: topLevelAdminsGroup.groupName,
  //     username: adminUser.username,
  //     userPoolId: auth.userPoolId,
  //     dependsOn: [adminUser, topLevelAdminsGroup]
  //   }
    
  // );
  // },  5000); // wait for 5 second before adding the user to the group


  const cognitoAccessPolicy = new iam.PolicyStatement({
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
          ISO_TABLE: isoTable.tableName,
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
          handler: "services/functions/doc/getUrlForPut.main",
        },
      },
      "GET /docs": {
        function: {
          handler: "services/functions/doc/list.main",
          bind: [docTable],
        },
      },
      "GET /docs/{docId}": {
        function: {
          handler: "services/functions/doc/get.main",
          bind: [docTable],
        },
      },
      "POST /docs": {
        function: {
          handler: "services/functions/doc/create.main",
          bind: [docTable],
        },
      },
      "DELETE /docs/{docId}": {
        function: {
          handler: "services/functions/doc/delete.main",
        },
      },

      

      "GET   /forms": {
        function: {
          handler: "services/functions/form/list.main",
        },
      },
      "GET   /forms/{formId}": {
        function: {
          handler: "services/functions/form/get.main",
          bind: [templateTable, formTable],
        },
      },
      "POST  /forms": {
        function: {
          handler: "services/functions/form/create.main",
          bind: [formTable],
        },
      },
      "PUT   /forms/{formId}": {
        function: {
          handler: "services/functions/form/update.main",
          bind: [formTable],
        },
      },

      "GET   /templates": {
        function: {
          handler: "services/functions/template/list.main",
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
        },
      },
      "PUT   /templates/{templateId}": {
        function: {
          handler: "services/functions/template/update.main",
          bind: [templateTable],
        },
      },
      "GET   /templates/{templateId}/forms": {
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
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "GET   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/get.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "POST   /tenants": {
        function: {
          handler: "services/functions/tenant/create.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "PUT   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/update.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "DELETE   /tenants/{tenantId}": {
        function: {
          handler: "services/functions/tenant/delete.main",
          bind: [tenantTable],
          environment: {
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      
      "GET   /mytenant": {
        function: {
          handler: "services/functions/tenant/getmytenant.main",
          bind: [tenantTable],
        },
      },
      "GET /users": {
        function: {
          handler: "services/functions/user/list.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "GET /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/list.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "GET /users/{username}": {
        function: {
          handler: "services/functions/user/get.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "GET /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/get.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "POST /users": {
        function: {
          handler: "services/functions/user/create.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "POST /tenants/{tenantId}/users": {
        function: {
          handler: "services/functions/user/create.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
      "PUT /users/{username}": {
        function: {
          handler: "services/functions/user/update.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: ADMIN_GROUP
          },
        },
      },
      "PUT /tenants/{tenantId}/users/{username}": {
        function: {
          handler: "services/functions/user/update.main",
          permissions: [cognitoAccessPolicy],
          environment: {
            USER_POOL_ID: auth.userPoolId,
            ALLOWED_GROUPS: TOP_LEVEL_ADMIN_GROUP
          }
        },
      },
     
      // ###############  N Sectoin ####################
      "GET   /forms": {
        function: {
          handler: "services/functions/nform/list.main",
          bind: [nformTable],
        },
      },
      "GET   /nforms/{formId}": {
        function: {
          handler: "services/functions/nform/get.main",
          bind: [ntemplateTable, nformTable],
        },
      },
      "POST  /nforms": {
        function: {
          handler: "services/functions/nform/create.main",
          bind: [nformTable],
        },
      },
      "PUT   /nforms/{formId}": {
        function: {
          handler: "services/functions/nform/update.main",
          bind: [nformTable],
        },
      },

      "GET   /ntemplates": {
        function: {
          handler: "services/functions/ntemplate/list.main",
          bind: [ntemplateTable, nformTable],
        },
      },
      "GET   /ntemplates/{templateId}": {
        function: {
          handler: "services/functions/ntemplate/get.main",
          bind: [ntemplateTable, nformTable],
        },
      },
      "POST   /ntemplates": {
        function: {
          handler: "services/functions/ntemplate/create.main",
          bind: [ntemplateTable],
        },
      },
      "PUT   /ntemplates/{templateId}": {
        function: {
          handler: "services/functions/ntemplate/update.main",
          bind: [ntemplateTable],
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
