import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.WORKSPACE_TABLE,

    Key: {
      tenant: tenant, 
      workspaceId: event.pathParameters.workspaceId, 
    },
    UpdateExpression: `SET 
      workspaceName = :workspaceName, 
      category = :category, 
      subCategory = :subCategory, 
      clientName = :clientName, 
      note = :note,
      startDate = :startDate,
      endDate = :endDate,
      status = :status    
      `,
    ExpressionAttributeValues: {
      ":workspaceName": data.workspaceName,
      ":category": data.category || "",
      ":subCategory": data.subCategory || "",
      ":clientName": data.clientName || "",
      ":note": data.note || "",
      ":startDate": data.startDate || "",
      ":endDate": data.endDate || "",
      ":status": data.status || "",
    },
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});