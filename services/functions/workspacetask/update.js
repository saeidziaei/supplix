import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`,
      taskId: event.pathParameters.taskId,
    },
    UpdateExpression: `SET 
    userId = :userId, 
    taskName= :taskName,
    note= :note,
    startDate= :startDate,
    dueDate= :dueDate,
    completionDate = :completionDate,
    taskCode = :taskCode,
    taskType = :taskType,
    correctiveAction = :correctiveAction,
    rootCause = :rootCause,
    taskStatus = :taskStatus,
    updatedBy = :updatedBy,
    updatedAt = :updatedAt`
    ,
    ExpressionAttributeValues: 
    {
      ":userId": data.userId || "",
      ":taskName": data.taskName || "",
      ":note": data.note || "",
      ":startDate": data.startDate || "",
      ":dueDate": data.dueDate || "",
      ":completionDate": data.completionDate || "",
      ":taskCode": data.taskCode || "",
      ":taskType": data.taskType || "",
      ":correctiveAction": data.correctiveAction || "",
      ":rootCause": data.rootCause || "",
      ":taskStatus": data.taskStatus || "",
      ":updatedBy": event.requestContext.authorizer.jwt.claims.sub,
      ":updatedAt": Date.now(), 
    },
    

    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});


