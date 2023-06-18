import handler from "../../util/handler";
import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";
import * as uuid from "uuid";
import dynamodb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {

  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda context.
  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new CognitoIdentityServiceProvider();
  const username = event.pathParameters.username;

  const params = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const result = await client.adminDeleteUser(params);

 
  // Also delete from DB
  const deleteParams = {
    TableName: process.env.USER_TABLE,
    Key: {
      tenant: tenantId,
      Username: username,
    }

  };

  await dynamodb.delete(deleteParams); 

  return result;
});
