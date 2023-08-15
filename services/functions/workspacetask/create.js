import { NCR_WORKSAPCE_ID, RECURRING } from "../../util/constants";
import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";
import * as uuid from "uuid";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);
  const isRecurring = process.env.TASK_MODE === RECURRING;

  const workspaceId = event.pathParameters.workspaceId;
  let item = {
    tenant_workspaceId: `${tenant}_${workspaceId}`, // pk
    tenant: tenant,
    workspaceId: workspaceId, 
    taskId: uuid.v1(), 
    userId: data.userId || "-1", // userId is in a secondary index and cannot be empty
    taskName: data.taskName || "",
    note: data.note || "",

    startDate: data.startDate || "",

    taskCode: data.taskCode || "",
    taskType: data.taskType || "",
    taskStatus: data.taskStatus || "",

    createdBy: event.requestContext.authorizer.jwt.claims.sub,
    createdAt: Date.now(), 
  };

  if (!isRecurring) {
      item = {
        ...item,
        dueDate: data.dueDate || "",
        completionDate: data.completionDate || "",
      };
      if (workspaceId === NCR_WORKSAPCE_ID) {
        item = {
          ...item,
          correctiveAction: data.correctiveAction || "", // only for NCR
          rootCause: data.rootCause || "", // only for NCR
        };
      } 
    } else {
      item = {
        ...item,
        isRecurring: "Y",
        endDate: data.endDate || "",
        frequency: data.frequency || "",
      };
    }
  
  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    Item: item,
  };

  await dynamoDb.put(params);

  return params.Item;
});