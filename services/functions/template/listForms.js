import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
  const params = {
    TableName: process.env.FORM_TABLE,
    FilterExpression: "customerIsoId = :customerIsoId and templateId = :templateId",
    ExpressionAttributeValues: {
      ":customerIsoId": event.pathParameters.customerIsoId,
      ":templateId": event.pathParameters.templateId,
    },
  };
  const result = await dynamoDb.scan(params);

  return result.Items;

});

