import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {

const params = {
  TableName: process.env.DOC_TABLE,
  KeyConditionExpression: "tenant_workspaceId = :tenant_workspaceId",
  ExpressionAttributeValues: {
    ":tenant_workspaceId": `${tenant}_${workspaceUser.workspaceId}`, // pk
  },
};
const result = await dynamoDb.query(params);
// Return the matching list of items in response body
return result.Items;
});


