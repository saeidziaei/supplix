import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.TEMPLATE_TABLE,

    Key: {
      tenant: tenant, 
      templateId: event.pathParameters.templateId, 
    },
    UpdateExpression: "SET templateDefinition = :templateDefinition",
    ExpressionAttributeValues: {
      ":templateDefinition": data.templateDefinition,
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});