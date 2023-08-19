import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub;

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    IndexName: "userIndex",
    KeyConditionExpression: "tenant = :tenant AND userId = :userId",
    FilterExpression: "isRecurring <> :isRecurringValue", // Exclude items where isRecurring is "Y"
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":userId": userId,
      ":isRecurringValue": "Y", // Value to filter out
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;
});
