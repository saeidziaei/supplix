import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";
import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);


  // TODO do we need this check?
  // if (workspaceUser.userId === data.userId) {
  //   throw new Error("You cannot add yourself to the team.");
  // }

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