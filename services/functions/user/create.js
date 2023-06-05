import handler from "../../util/handler";
import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";
import * as uuid from "uuid";
import dynamodb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);

  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda context.
  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new CognitoIdentityServiceProvider();

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
      { Name: 'email_verified', Value: 'true' },
      {
        Name: "custom:tenant",
        Value: tenantId // Tenant ID of the new user
      }
    ]
  };

  const result = await client.adminCreateUser(params);

  // Add user to or remove from "admins" group depending on the value of data.isAdmin
  const groupParams = {
    GroupName: "admins",
    UserPoolId: userPoolId,
    Username: data.email
  };
  if (data.isAdmin) {
    await client.adminAddUserToGroup(groupParams);
  }
  
  // Save other attributes in DB
  const insertParams = {
    TableName: process.env.USER_TABLE,
    Item: {
      tenant: tenantId,
      Username: result.User.Username,
      photo: data.photo,
      employeeNumber: data.employeeNumber,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamodb.put(insertParams); 

  return result;
});
