import * as iam from "aws-cdk-lib/aws-iam";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Cognito, use } from "@serverless-stack/resources";
import { StorageStack } from "./StorageStack";
import { ApiStack } from "./ApiStack";

export function AuthStack({ stack, app }) {
  const { bucket } = use(StorageStack);
  const { api } = use(ApiStack);
  // Create a Cognito User Pool and Identity Pool
  const auth = new Cognito(stack, "Auth", {
    login: ["email"],
  });

  const topLevelAdminsGroup = new cognito.CfnUserPoolGroup(this, 'TopLevelAdmins', {
    groupName: 'top-level-admins',
    userPoolId: auth.userPoolId
  }); 

  auth.attachPermissionsForAuthUsers(auth, [
    // Allow access to the API
    api,
    // TODO - fine grain API access control
    // new iam.PolicyStatement({
    //   action: "execute-api:Invoke",
    //   effect: iam.Effect.ALLOW,
    //   resource:
    //     "arn:aws:execute-api:<REGION>:<ACCOUNT_ID>:<API_ID>/<STAGE>/<METHOD>/<RESOURCE_PATH>",
    //   condition: {
    //     stringEquals: {
    //       "cognito-identity.amazonaws.com:sub":
    //         "$context.identity.cognitoIdentityId",
    //       "cognito-groups.amazonaws.com:groups": topLevelAdminsGroup.groupName,
    //     },
    //   },
    // }),

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
  });
  // Return the auth resource
  return {
    auth,
  };
}