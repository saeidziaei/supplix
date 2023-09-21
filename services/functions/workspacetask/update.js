import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import { NCR_WORKSAPCE_ID, RECURRING } from "../../util/constants";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);
  const isRecurring = process.env.TASK_MODE === RECURRING;
  const workspaceId = event.pathParameters.workspaceId;

  let updateExpression = `SET 
  userId = :userId, 
  taskName= :taskName,
  note= :note,
  startDate= :startDate,
  
  taskCode = :taskCode,
  taskType = :taskType,
  
  
  taskStatus = :taskStatus,
  updatedBy = :updatedBy,
  updatedAt = :updatedAt`;

  let expressionAttributeValues = {
    ":userId": data.userId || "-1",
    ":taskName": data.taskName || "",
    ":note": data.note || "",
    ":startDate": data.startDate || "",
    ":taskCode": data.taskCode || "",
    ":taskType": data.taskType || "",
    ":taskStatus": data.taskStatus || "",
    ":updatedBy": event.requestContext.authorizer.jwt.claims.sub,
    ":updatedAt": Date.now(),
  };

  if (!isRecurring) {
    updateExpression += `${data.dueDate ? ", dueDate= :dueDate" : ""} 
    ${data.completionDate ? ", completionDate= :completionDate" : ""}`;
    expressionAttributeValues = {
      ...expressionAttributeValues,
      ...(data.dueDate ? { ":dueDate": data.dueDate } : {}),
      ...(data.completionDate ? { ":completionDate": data.completionDate } : {}),
    };

    if (workspaceId === NCR_WORKSAPCE_ID) {
      updateExpression +=
        ", correctiveAction = :correctiveAction, rootCause = :rootCause";
      expressionAttributeValues = {
        ...expressionAttributeValues,
        ":correctiveAction": data.correctiveAction || "",
        ":rootCause": data.rootCause || "",
      };
    }
  } else {
    updateExpression += `${data.endDate ? ", endDate= :endDate" : ""} , frequency = :frequency`;
    expressionAttributeValues = {
      ...expressionAttributeValues,
      ...(data.endDate ? { ":endDate": data.endDate } : {}),
      ":frequency": data.frequency || "Daily",
    };
  }
  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`,
      taskId: event.pathParameters.taskId,
    },
    UpdateExpression: updateExpression
    ,
    ExpressionAttributeValues: expressionAttributeValues
    ,
    

    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});

