import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.DOC_TABLE,
    // 'Key' defines the partition key and sort key of the item to be removed
    Key: {
      tenant: tenant,
      docId: event.pathParameters.docId,
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});