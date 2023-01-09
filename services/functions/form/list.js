import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
const params = {
  TableName: process.env.FORM_TABLE,
  KeyConditionExpression: "customerIsoId = :customerIsoId",
  ExpressionAttributeValues: {
    ":customerIsoId": event.pathParameters.customerIsoId,
  },
};
const result = await dynamoDb.query(params);

return result.Items;
});
