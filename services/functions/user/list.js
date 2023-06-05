import handler from "../../util/handler";
import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";
import dynamodb from "../../util/dynamodb";
import s3 from "../../util/s3";

export const main = handler(async (event, tenant) => {
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda contxt.

  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new CognitoIdentityServiceProvider();

  const result = await client.listUsers({ UserPoolId: userPoolId, });

  let ret = result.Users;

  if (result && result.Users) {
    ret = result.Users.filter((u) => getUserTenant(u) == tenantId);

    // Parallelize the execution of the following tasks for each user
    await Promise.all(
      ret.map(async (user) => {
        const groupsResult = await client.adminListGroupsForUser({
          UserPoolId: userPoolId,
          Username: user.Username,
        });
        user.isAdmin = groupsResult.Groups.some(
          (group) => group.GroupName === ADMIN_GROUP
        );
        user.isTopLevelAdmin = groupsResult.Groups.some(
          (group) => group.GroupName === TOP_LEVEL_ADMIN_GROUP
        );
        const getParams = {
          TableName: process.env.USER_TABLE,
          Key: {
            tenant: tenantId,
            Username: user.Username,
          },
        };
        const dbResult = await dynamodb.get(getParams);
        let dbUser = dbResult.Item;
        if (!dbUser) return;
        if (!dbUser.photo) {
          Object.assign(user, dbUser);
          return;
        }
        const s3params = {
          Bucket: process.env.BUCKET,
          Key: `private/${tenantId}/${dbUser.photo}`,
          Expires: 5 * 60, // 5 minutes
        };
        const photoURL = await s3.getSignedUrlForGet(s3params);
        Object.assign(user, dbUser, { photoURL });
      })
    );
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