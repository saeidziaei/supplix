import handler from "../../util/handler";
import AWS from "aws-sdk";

export const main = handler(async (event) => {
  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const result = await client.listUsers({
    UserPoolId: userPoolId,
  }).promise();


  return result.Users;
});
