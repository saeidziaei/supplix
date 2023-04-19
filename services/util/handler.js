import AWS from "aws-sdk";
import dynamodb from "./dynamodb";

export default function handler(lambda) {
  return async function (event, context) {
    let body, statusCode, tenant, workspaceId;

    // Start debugger
    // debug.init(event);

    try {
      tenant = getTenantFromRequest(event);
      workspaceId = getWorkspaceFromRequest(event);
      const workspaceUser = workspaceId ? getWorkspaceUser(tenant, workspaceId, event.requestContext.authorizer.jwt.claims.sub) : null;

      if (workspaceId && !workspaceUser) { // workspace is in the url path but the association for this user doesn't exist
        body = {error: 'Unauthorised. User not in workspace. Contact your administrator please.'};
        statusCode = 403;
      }
      else {
        const allowedGroups = process.env.ALLOWED_GROUPS
          ? process.env.ALLOWED_GROUPS.split(",")
          : [];
        const userGroups = getUserGroups(event);

        if (
          allowedGroups.length === 0 ||
          allowedGroups.some((group) => userGroups.includes(group))
        ) {
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


async function getWorkspaceUser(tenant, workspaceId, userId) {
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceId}`, 
      userId: userId,
    },
  };

  const result = await dynamodb.get(params);
  if (!result.Item) {
    return null
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


