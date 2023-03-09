import handler from "../../util/handler";
import AWS from "aws-sdk";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";

export const main = handler(async (event, tenant) => {
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda contxt.
  const tenantId =
    event.pathParameters && event.pathParameters.tenantId
      ? event.pathParameters.tenantId
      : tenant;

  const username = event.pathParameters.username;
  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const result = await client.adminGetUser(params).promise();

  // Check that the user belongs to the correct tenant
  if (getUserTenant(result) !== tenantId) {
    throw new Error("User does not belong to the specified tenant.");
  }

  // Check if the user is a member of the "admins" group
  const groupsParams = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const groups = await client.adminListGroupsForUser(groupsParams).promise();
  result.isAdmin = groups.Groups.some((group) => group.GroupName === ADMIN_GROUP);
  result.isTopLevelAdmin = groups.Groups.some((group) => group.GroupName === TOP_LEVEL_ADMIN_GROUP);

  return result;
});

function getUserTenant(user) {
  // strange, it is UserAttributes here and just Attributes in the list function. Cognito inconsistency ?!
  const att = user.UserAttributes.find((a) => a.Name == "custom:tenant");

  if (att) return att.Value;

  return undefined;
}
