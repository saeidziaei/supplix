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
      parentId = :parentId,
      workspaceName = :workspaceName, 
      category = :category, 
      workspaceCode = :workspaceCode, 
      clientName = :clientName, 
      note = :note,
      startDate = :startDate,
      endDate = :endDate,
      workspaceStatus = :workspaceStatus,
      templateCategories = :templateCategories
      `,
    ExpressionAttributeValues: {
      ":parentId": data.parentId,
      ":workspaceName": data.workspaceName,
      ":category": data.category || "",
      ":workspaceCode": data.workspaceCode || "",
      ":clientName": data.clientName || "",
      ":note": data.note || "",
      ":startDate": data.startDate || "",
      ":endDate": data.endDate || "",
      ":workspaceStatus": data.workspaceStatus || "",
      ":templateCategories": data.templateCategories || [],
    },
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});