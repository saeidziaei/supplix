import handler from "../../util/handler";
import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";
import * as uuid from "uuid";
import dynamodb from "../../util/dynamodb";



export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);

  // if TOP_LEVEL_ADMIN is calling, get tenant from query string as they can add to any tenant
  // otherwise, use tenant in the lambda context.
  const tenantId = event.pathParameters && event.pathParameters.tenantId ? event.pathParameters.tenantId : tenant;
  const createdBy = event.requestContext.authorizer.jwt.claims.sub;
  const { email, password, firstName, lastName, photo, employeeNumber } = data;

  return await createNewUser(tenantId, data.isAdmin, email, password, firstName, lastName, photo, employeeNumber, createdBy);



  // const userPoolId = process.env.USER_POOL_ID;
  // const client = new CognitoIdentityServiceProvider();

  // const params = {
  //   UserPoolId: userPoolId,
  //   Username: data.email,
  //   TemporaryPassword: data.password, // Temporary password for the new user

  //   UserAttributes: [
  //     {
  //       Name: "given_name",
  //       Value: data.firstName // First name of the new user
  //     },
  //     {
  //       Name: "family_name",
  //       Value: data.lastName // Last name of the new user
  //     },
  //     {
  //       Name: "email",
  //       Value: data.email // Email address of the new user
  //     },
  //     { Name: 'email_verified', Value: 'true' },
  //     {
  //       Name: "custom:tenant",
  //       Value: tenantId // Tenant ID of the new user
  //     }
  //   ]
  // };

  // const result = await client.adminCreateUser(params);

  // // Add user to or remove from "admins" group depending on the value of data.isAdmin
  // const groupParams = {
  //   GroupName: "admins",
  //   UserPoolId: userPoolId,
  //   Username: data.email
  // };
  // if (data.isAdmin) {
  //   await client.adminAddUserToGroup(groupParams);
  // }
  
  // // Save other attributes in DB
  // const insertParams = {
  //   TableName: process.env.USER_TABLE,
  //   Item: {
  //     tenant: tenantId,
  //     Username: result.User.Username,
  //     photo: data.photo || "",
  //     employeeNumber: data.employeeNumber || "",
  //     createdBy: event.requestContext.authorizer.jwt.claims.sub,
  //     createdAt: Date.now(), // Current Unix timestamp
  //   },
  // };

  // await dynamodb.put(insertParams); 

  // return result;
});


export async function createNewUser(tenantId, isAdmin, email, password, firstName, lastName, photo, employeeNumber, createdBy) {

  const userPoolId = process.env.USER_POOL_ID;
  const client = new CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: password, // Temporary password for the new user

    UserAttributes: [
      {
        Name: "given_name",
        Value: firstName // First name of the new user
      },
      {
        Name: "family_name",
        Value: lastName // Last name of the new user
      },
      {
        Name: "email",
        Value: email // Email address of the new user
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
    Username: email
  };
  if (isAdmin) {
    await client.adminAddUserToGroup(groupParams);
  }
  
  // Save other attributes in DB
  const insertParams = {
    TableName: process.env.USER_TABLE,
    Item: {
      tenant: tenantId,
      Username: result.User.Username,
      photo: photo || "",
      employeeNumber: employeeNumber || "",
      createdBy: createdBy,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamodb.put(insertParams); 

  return result;

}


// Contactors logic
//
// The first tenant that add a contractor the user gets added (with tenant = contractors)
// Unlink internal usrs, attributes such as first name, last name etc. are defined in the database (instead of cognito). This is so tenants cannot interfere with one another
// The contractor logins as any other user. The UI will be completely different (no workspaces, no NCR and so on)
// Cognito User attributes (first and last name etc.) can only be edited by contractors themselves. 
// When a tenant deletes a contracto the cognito entity will reman active and only assciation gets deleted
// When a different tenant adds the same contractor, cognito entity will be reused