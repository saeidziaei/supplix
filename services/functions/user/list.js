import handler, { getUserTenant } from "../../util/handler";
import AWS from "aws-sdk";

export const main = handler(async (event, tenant) => {
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda contxt.
  const tenantId = event.pathParameters.tenantId ?? tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const result = await client.listUsers({ UserPoolId: userPoolId, }).promise();

  let ret = result.Users;

  if (result && result.Users) {
    ret = result.Users.filter(u => getUserTenant(u) == tenantId);
  }

  return ret;
});

function getUserTenant(user) {
  // strange, it is Attributes here and  UserAttributes in the get function. Cognito inconsistency ?!

  if (!user.Attributes)
    return undefined;

  const att = user.Attributes.find(a => a.Name == "custom:tenant");

  if (att) return att.Value;

  return undefined;
}