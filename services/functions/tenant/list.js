import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
const params = {
  TableName: process.env.TENANT_TABLE,
  FilterExpression: "tenantId <> :tenantId",
  ExpressionAttributeValues: {
    ":tenantId": "isocloud",
  },
};
const result = await dynamoDb.scan(params);
// Return the matching list of items in response body
return result.Items;
});
