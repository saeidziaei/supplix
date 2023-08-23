import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.TEMPLATE_TABLE,
    KeyConditionExpression: "tenant = :tenant",
    FilterExpression: "attribute_not_exists(isDeleted) OR isDeleted = :isDeletedValue", // Filter out deleted records
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":isDeletedValue": false,
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;
});

