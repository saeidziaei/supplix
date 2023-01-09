import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: process.env.FORM_TABLE,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    Key: {
      customerIsoId: event.pathParameters.customerIsoId, 
      formId: event.pathParameters.formId, 
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }
  // Return the retrieved item
  return result.Item;
});