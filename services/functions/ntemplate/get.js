import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const params = {
    TableName: process.env.NTEMPLATE_TABLE,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    Key: {
      customerId: event.pathParameters.customerId, 
      templateId: event.pathParameters.templateId, 
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }
  // Return the retrieved item
  return result.Item;
});

