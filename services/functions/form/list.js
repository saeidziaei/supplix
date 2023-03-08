import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant) => {
const params = {
  TableName: process.env.FORM_TABLE,
  KeyConditionExpression: "tenant = :tenant",
  ExpressionAttributeValues: {
    ":tenant": tenant,
  },
};
const result = await dynamoDb.query(params);

return result.Items;
});
