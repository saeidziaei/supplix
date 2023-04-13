import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.FORM_TABLE,
    KeyConditionExpression: "tenant = :tenant",
    FilterExpression: "templateId = :templateId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":templateId": event.pathParameters.templateId,
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;

});

