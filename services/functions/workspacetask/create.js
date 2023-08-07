import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";
import * as uuid from "uuid";

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
      userId: data.userId || "-1", // userId is in a secondary index and cannot be empty
      taskName: data.taskName || "",
      note: data.note || "",
      startDate: data.startDate || "",
      dueDate: data.dueDate || "",
      completionDate: data.completionDate || "",
      taskCode: data.taskCode || "",
      taskType: data.taskType || "",
      correctiveAction: data.correctiveAction || "", // NCR
      rootCause: data.rootCause || "", // NCR
      taskStatus: data.taskStatus || "",

      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), 
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});