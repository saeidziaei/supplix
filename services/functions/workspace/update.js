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
    UpdateExpression: "SET workspaceName = :workspaceName, category = :category, note = :note",
    ExpressionAttributeValues: {
      ":workspaceName": data.workspaceName,
      ":category": data.category,
      ":note": data.note,
    },
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});