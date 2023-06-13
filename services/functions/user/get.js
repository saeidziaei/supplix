import handler from "../../util/handler";
import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";
import dynamodb from "../../util/dynamodb";
import s3 from "../../util/s3";

export const main = handler(async (event, tenant) => {
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda contxt.
  const tenantId =
    event.pathParameters && event.pathParameters.tenantId
      ? event.pathParameters.tenantId
      : tenant;

  const username = event.pathParameters.username;
  const userPoolId = process.env.USER_POOL_ID;
  const client = new CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const result = await client.adminGetUser(params);

  if (!result) {
    throw new Error("User not found.");
  }
  // Check that the user belongs to the correct tenant
  if (getUserTenant(result) !== tenantId) {
    throw new Error("User does not belong to the specified tenant.");
  }

  // Check if the user is a member of the "admins" group
  const groupsParams = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const groups = await client.adminListGroupsForUser(groupsParams);
  result.isAdmin = groups.Groups.some(
    (group) => group.GroupName === ADMIN_GROUP
  );
  result.isTopLevelAdmin = groups.Groups.some(
    (group) => group.GroupName === TOP_LEVEL_ADMIN_GROUP
  );

  const getParams = {
    TableName: process.env.USER_TABLE,
    Key: {
      tenant: tenantId,
      Username: result.Username,
    },
  };

  const dbResult = await dynamodb.get(getParams);
  let dbUser = dbResult.Item;
  if (!dbUser) return result;

  if (!dbUser.photo) return { ...result, ...dbUser };

  const s3params = {
    Bucket: process.env.BUCKET,
    Key: `private/${tenantId}/${dbUser.photo}`,
    Expires: 15 * 60, // 15 minutes
  };

  return {
    ...result,
    ...dbUser,
    photoURL: await s3.getSignedUrlForGet(s3params),
  };

});

function getUserTenant(user) {
  // strange, it is UserAttributes here and just Attributes in the list function. Cognito inconsistency ?!
  const att = user.UserAttributes.find((a) => a.Name == "custom:tenant");

  if (att) return att.Value;

  return undefined;
}
