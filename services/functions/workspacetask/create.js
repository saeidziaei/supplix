import { ADMIN_GROUP, TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";
import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);

  const workspaceId = event.pathParameters.workspaceId;
  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    Item: {
      tenant_workspaceId: `${tenant}_${workspaceId}`, // pk
      tenant: tenant,
      workspaceId: workspaceId, 
      taskId: uuid.v1(), 
      userId: data.userId || "",
      taskName: data.taskName || "",
      note: data.note || "",
      startDate: data.startDate || "",
      dueDate: data.dueDate || "",

      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), 
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});