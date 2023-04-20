import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";
import dynamoDb from "../../util/dynamodb";
import handler, { getUserGroups } from "../../util/handler";

export const main = handler(async (event, tenant, workspaceUser) => {

  const userGroups = getUserGroups(event);
  if (workspaceUser.role !== "Owner" && !(
    userGroups.includes(TOP_LEVEL_ADMIN_GROUP) ||
    userGroups.includes(ADMIN_GROUP) 
    )) {
    throw new Error("User is not the owner of this workspace.");
  }

  const data = JSON.parse(event.body);
  const workspaceId = event.pathParameters.workspaceId;
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    Item: {
      tenant_workspaceId: `${tenant}_${workspaceId}`, // pk
      tenant: tenant,
      workspaceId: workspaceId, 
      userId: data.userId,
      role: data.role,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), 
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});