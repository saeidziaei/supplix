import handler from "../../util/handler";
import AWS from "aws-sdk";
import * as uuid from "uuid";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);

  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda context.
  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;
  
  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: data.email,
    TemporaryPassword: data.password, // Temporary password for the new user

    UserAttributes: [
      {
        Name: "given_name",
        Value: data.firstName // First name of the new user
      },
      {
        Name: "family_name",
        Value: data.lastName // Last name of the new user
      },
      {
        Name: "email",
        Value: data.email // Email address of the new user
      },
      {
        Name: "custom:tenant",
        Value: tenantId // Tenant ID of the new user
      }
    ]
  };

  const result = await client.adminCreateUser(params).promise();

  return result;
});
