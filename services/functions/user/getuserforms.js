import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const username = event.pathParameters.username;

  const params = {
    TableName: process.env.FORM_TABLE,
    IndexName: "userIndex",
    KeyConditionExpression: "tenant = :tenant AND userId = :userId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":userId": username,
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;
});
