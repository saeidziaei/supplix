import AWS from "aws-sdk";
import { TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";
export const handler = async () => {
    
  const client = new AWS.CognitoIdentityServiceProvider();

  const groupParams = {
    GroupName: TOP_LEVEL_ADMIN_GROUP,
    UserPoolId: process.env.USER_POOL_ID,
    Username: process.env.ADMIN_USERNAME
  };
  await client.adminAddUserToGroup(groupParams).promise();
}