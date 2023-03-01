import handler from "../../util/handler";
import AWS from "aws-sdk";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda context.
  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: data.username,
  };

  const user = await client.adminGetUser(params).promise();
  const userAttributes = user.UserAttributes;

  // Check if the tenantId matches the custom attribute "tenant" of the user
  const userTenant = userAttributes.find(attr => attr.Name === "custom:tenant").Value;
  if (userTenant !== tenantId) {
    throw new Error("User does not belong to the given tenant");
  }

  const resetParams = {
    UserPoolId: userPoolId,
    Username: data.username, // the username of the user to reset the password for
  };

  const result = await client.adminResetUserPassword(resetParams).promise();

  return result;
});
