import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const workspaceId = event.pathParameters.workspaceId;
  const { showAll } = event.queryStringParameters || {};

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    KeyConditionExpression: "tenant_workspaceId = :tenant_workspaceId",
    ExpressionAttributeValues: {
      ":tenant_workspaceId": `${tenant}_${workspaceId}`,
    },
  };

  if (showAll !== "true") {
    // Exclude completed tasks
    params.FilterExpression = "taskStatus <> :completed AND taskStatus <> :cancelled";
    params.ExpressionAttributeValues[":completed"] = "Completed";
    params.ExpressionAttributeValues[":cancelled"] = "Cancelled";
  }
  const result = await dynamoDb.query(params);

  return result.Items;
});

