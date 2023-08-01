import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const workspaceId = event.pathParameters.workspaceId;

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    KeyConditionExpression: "tenant_workspaceId = :tenant_workspaceId",
    ExpressionAttributeValues: {
      ":tenant_workspaceId": `${tenant}_${workspaceId}`,
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;
});

