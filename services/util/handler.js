import AWS from "aws-sdk";
import dynamodb from "./dynamodb";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "./constants";

export default function handler(lambda) {
  return async function (event, context) {
    let body, statusCode;

    // Start debugger
    // debug.init(event);

    try {
      const tenant = getTenantFromRequest(event);
      const workspaceId = getWorkspaceFromRequest(event);
      const allowedGroups = getAllowedGroups();
      const userGroups = getUserGroups(event);
      const isAdmin = userGroups.includes(TOP_LEVEL_ADMIN_GROUP) || userGroups.includes(ADMIN_GROUP);
      let workspaceUser = workspaceId
        ? await getWorkspaceUser(isAdmin,
            tenant,
            workspaceId,
            event.requestContext.authorizer.jwt.claims.sub
          )
        : null;
      

      if (workspaceId && !workspaceUser) { // workspace is in the url path but the user is not in the team 
        body = {error: 'Unauthorised. User not in workspace. Contact your administrator please.'};
        statusCode = 403;
      }
      else {
        if (allowedGroups.length === 0 || allowedGroups.some((group) => userGroups.includes(group))) {
          body = await lambda(event, tenant, workspaceUser, context);
          statusCode = 200;
        } else {
          body = { error: "Unauthorised" };
          statusCode = 403;
        }
      }
    } catch (e) {
      // Print debug messages
      //   debug.flush(e);

      body = { error: e.message };
      statusCode = 500;
      // TODO Log to Cloudwatch
      // {tenantId, workspaceId, e.message .... other info}
    }

    // Return HTTP response
    return {
      statusCode,
      body: JSON.stringify(body),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
    };
  };
}


function getAllowedGroups() {
  return process.env.ALLOWED_GROUPS ? process.env.ALLOWED_GROUPS.split(",") : [];
}

async function getWorkspaceUser(isAdmin, tenant, workspaceId, userId) {
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceId}`, 
      userId: userId,
    },
  };

  const result = await dynamodb.get(params);
  if (!result.Item) {
    if (isAdmin) // admin can access any workspace
      return {
        workspaceId,
        userId,
        role: "Owner",
      };
    else return null;
  }
  return result.Item;

}

function getWorkspaceFromRequest(event) {
  return event.pathParameters ? event.pathParameters.workspaceId : null;
}

function getTenantFromRequest(event) {
  const claims = event.requestContext.authorizer.jwt.claims;
  return claims['custom:tenant'];
}

export function getUserGroups(event) {
  return event.requestContext.authorizer.jwt.claims["cognito:groups"] || [];
}

export async function getUser(username) {
  
  const userPoolId = process.env.USER_POOL_ID;
  const client = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const result = await client.adminGetUser(params).promise();

  return {
    firstName: getAttribute(result, "given_name") || "",
    lastName: getAttribute(result, "family_name") || "",
  }
}


function getAttribute(user, attributeName) {
  const attribute = user.UserAttributes.find(
    (attr) => attr.Name === attributeName
  );
  if (attribute) {
    return attribute.Value;
  } else {
    return undefined;
  }
}


