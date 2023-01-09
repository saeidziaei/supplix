import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.FORM_TABLE,

    Key: {
      customerIsoId: event.pathParameters.customerIsoId, 
      formId: event.pathParameters.formId, 
    },
    UpdateExpression: "SET values = :values",
    ExpressionAttributeValues: {
      ":values": data.values,
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});