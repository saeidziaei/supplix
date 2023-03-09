import handler from "../../util/handler";
import AWS from "aws-sdk";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";

export const main = handler(async (event, tenant) => {
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda contxt.

  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const result = await client.listUsers({ UserPoolId: userPoolId, }).promise();

  let ret = result.Users;

  if (result && result.Users) {
    ret = result.Users.filter(u => getUserTenant(u) == tenantId);

    for (let i = 0; i < ret.length; i++) {
      const user = ret[i];
      const groupsResult = await client.adminListGroupsForUser({ UserPoolId: userPoolId, Username: user.Username }).promise();
      ret[i].isAdmin = groupsResult.Groups.some(group => group.GroupName === ADMIN_GROUP);
      ret[i].isTopLevelAdmin = groupsResult.Groups.some(group => group.GroupName === TOP_LEVEL_ADMIN_GROUP);
    }
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