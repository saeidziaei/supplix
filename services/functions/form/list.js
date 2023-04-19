import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant, workspaceUser) => {
const params = {
  TableName: process.env.FORM_TABLE,
  KeyConditionExpression: "tenant = :tenant AND begins_with(workspaceId_formId, :workspaceId)",
  ExpressionAttributeValues: {
    ":tenant": tenant,
    ":workspaceId": workspaceUser.workspaceId,
  },
};
const result = await dynamoDb.query(params);

return result.Items;
});
