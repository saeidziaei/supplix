import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
  const params = {
    TableName: process.env.NFORM_TABLE,
    FilterExpression: "customerId = :customerId and templateId = :templateId",
    ExpressionAttributeValues: {
      ":customerId": event.pathParameters.customerId,
      ":templateId": event.pathParameters.templateId,
    },
  };
  const result = await dynamoDb.scan(params);

  return result.Items;

});

