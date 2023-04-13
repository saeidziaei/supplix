import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    KeyConditionExpression: "tenant = :tenant AND workspaceId = :workspaceId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":workspaceId": event.pathParameters.workspaceId
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;
});

