import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
const params = {
  TableName: process.env.NFORM_TABLE,
  KeyConditionExpression: "customerId = :customerId",
  ExpressionAttributeValues: {
    ":customerId": event.pathParameters.customerId,
  },
};
const result = await dynamoDb.query(params);

return result.Items;
});
