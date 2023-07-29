import { CognitoIdentityProvider as CognitoIdentityServiceProvider } from "@aws-sdk/client-cognito-identity-provider";
import dynamodb from "./dynamodb";
import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "./constants";
import { getWorkspaceById } from "../functions/workspace/get";

export default function handler(lambda) {
  return async function (event, context) {
    let body, statusCode;

    // Start debugger
    // debug.init(event);

    try {
      const userGroups = getUserGroups(event);
      const tenant = getTenantFromRequest(event);
      const workspaceId = getWorkspaceIdFromRequest(event);
      const allowedGroups = getAllowedGroups();
      const isAdmin = userGroups.includes(TOP_LEVEL_ADMIN_GROUP) || userGroups.includes(ADMIN_GROUP);
      let workspaceUser = workspaceId
        ? await getWorkspaceUser(isAdmin, tenant, workspaceId, event.requestContext.authorizer.jwt.claims.sub)
        : null;
      

      if (workspaceId) { 
        if (!workspaceUser) { // workspace is in the url path but the user is not in the team 
          return httpResponse(403, {
            error:
              "Unauthorised. User not in workspace. Contact your workspace owner please.",
          });
        }
        const allowedWorkspaceRoles = getWorkspaceAllowedRoles();
        if (allowedWorkspaceRoles.length > 0 && ! allowedWorkspaceRoles.includes(workspaceUser.role)) {
          return httpResponse(403, {
            error:
              "Unauthorised workspace access.",
          });
        }
      }

      if (allowedGroups.length > 0 && !allowedGroups.some((group) => userGroups.includes(group))) {
        return httpResponse(403, { error: "Unauthorised" });
      }


      body = await lambda(event, tenant, workspaceUser, context);

      if (workspaceId && getHttpMethod(event) === 'GET') { // inject workspace into the response
        let workspace = await getWorkspaceById(tenant, workspaceId);
        workspace.role = workspaceUser ? workspaceUser.role : "";
        body = { data: body, workspace };
      }

      statusCode = 200;

    } catch (e) {
      // Print debug messages
      //   debug.flush(e);

      body = { error: e.message };
      statusCode = 500;
      // TODO Log to Cloudwatch
      // {tenantId, workspaceId, e.message .... other info}
    }

    return httpResponse(statusCode, body);
  };


}

function httpResponse(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
  };
}
function getHttpMethod(event) {
  if (!event || !event.requestContext || !event.requestContext.http) 
    return null;
    
  return event.requestContext.http.method;
}
function getAllowedGroups() {
  return process.env.ALLOWED_GROUPS ? process.env.ALLOWED_GROUPS.split(",") : [];
}
function getWorkspaceAllowedRoles() {
  return process.env.WORKSPACE_ALLOWED_ROLE ? process.env.WORKSPACE_ALLOWED_ROLE.split(",") : [];
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

function getWorkspaceIdFromRequest(event) {
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
  const client = new CognitoIdentityServiceProvider();

  const params = {
    UserPoolId: userPoolId,
    Username: username,
  };

  const result = await client.adminGetUser(params);

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


