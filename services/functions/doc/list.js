import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
    // TODO remove this
    if (!tenant) {
      tenant = 'tenant1';
    }
  
const params = {
  TableName: process.env.DOC_TABLE,
  KeyConditionExpression: "tenant = :tenant",
  ExpressionAttributeValues: {
    ":tenant": tenant
  },
};
const result = await dynamoDb.query(params);
// Return the matching list of items in response body
return result.Items;
});


