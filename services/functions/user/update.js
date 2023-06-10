import dynamodb from "../../util/dynamodb";
import handler from "../../util/handler";
import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda context.
  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;

  const userPoolId = process.env.USER_POOL_ID;
  const client = new CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: data.Username,
  };

  const user = await client.adminGetUser(params);
  const userAttributes = user.UserAttributes;

  // Check if the tenantId matches the custom attribute "tenant" of the user
  const userTenant = userAttributes.find(attr => attr.Name === "custom:tenant").Value;
  if (userTenant !== tenantId) {
    throw new Error("User does not belong to the given tenant");
  }

  const updateParams = {
    UserPoolId: userPoolId,
    Username: data.Username, // the username of the user to update
    UserAttributes: [
      {
        Name: "given_name",
        Value: data.firstName // First name of the user to update
      },
      {
        Name: "family_name",
        Value: data.lastName // Last name of the user to update
      },
      {
        Name: "email",
        Value: data.email // Email address of the user to update
      },
      {Name: "email_verified", Value: "true" },
    ]
  };

  const result = await client.adminUpdateUserAttributes(updateParams);
  
  // Add user to or remove from "admins" group depending on the value of data.isAdmin
  const groupParams = {
    GroupName: "admins",
    UserPoolId: userPoolId,
    Username: data.email
  };
  if (data.isAdmin) {
    await client.adminAddUserToGroup(groupParams);
  } else {
    await client.adminRemoveUserFromGroup(groupParams);
  }


  
  

  let updateExpression = "SET employeeNumber= :employeeNumber, updatedByUser= :updatedByUser, updatedAt= :updatedAt";
  let expressionAttributes = {
    ":employeeNumber": data.employeeNumber || "",
    ":updatedByUser": event.requestContext.authorizer.jwt.claims.sub,
    ":updatedAt": Date.now(),
  };

  if (data.photo) {
    updateExpression += ", photo = :photo";
    expressionAttributes[":photo"] = data.photo;
  }
  // TODO delete oldPhoto from s3


  const dbParams = {
    TableName: process.env.USER_TABLE,
    
    Key: {
      tenant: tenantId,
      Username: data.Username,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributes,
    
    ReturnValues: "ALL_NEW",
  };
  await dynamodb.update(dbParams);

  return result;
});
