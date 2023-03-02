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

  const updateParams = {
    UserPoolId: userPoolId,
    Username: data.username, // the username of the user to update
    UserAttributes: [
      {
        Name: "given_name",
        Value: data.firstName // First name of the user to update
      },
      {
        Name: "family_name",
        Value: data.lastName // Last name of the user to update
      },
      // {
      //   Name: "phone_number",
      //   Value: data.phone // Last name of the new user
      // },
      // {Name: "phone_number_verified", Value: "true" },
      {
        Name: "email",
        Value: data.email // Email address of the user to update
      },
      {Name: "email_verified", Value: "true" },
    ]
  };

  const result = await client.adminUpdateUserAttributes(updateParams).promise();

  return result;
});
