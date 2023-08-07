import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub;

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    IndexName: "userIndex",
    KeyConditionExpression: "tenant = :tenant AND userId = :userId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":userId": userId,
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;
});
