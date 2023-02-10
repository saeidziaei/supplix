import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.PROCESS_TABLE,

    Key: {
      customerIsoId: event.pathParameters.customerIsoId, 
      processId: 'top-level', 
    },
    UpdateExpression: "SET tree = :tree",
    ExpressionAttributeValues: {
      ":tree": data.tree,
    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});