import handler from "../../util/handler";
import AWS from "aws-sdk";

export const main = handler(async (event, tenant) => {
    // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda contxt.
  const tenantId = event.pathParameters.tenantId ?? tenant;

  const username = event.pathParameters.username;
  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: username
  };

  const result = await client.adminGetUser(params).promise();

  // Check that the user belongs to the correct tenant
  if (getUserTenant(result) !== tenantId) {
    throw new Error("User does not belong to the specified tenant.");
  }

  return result;
});


function getUserTenant(user) {
  // strange, it is UserAttributes here and just Attributes in the list function. Cognito inconsistency ?!
  const att = user.UserAttributes.find(a => a.Name == "custom:tenant");

  if (att) return att.Value;

  return undefined;
}