import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant, workspaceUser) => {
  const params = {
    TableName: process.env.DOC_TABLE,
    // 'Key' defines the partition key and sort key of the item to be removed
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      docId: event.pathParameters.docId,
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});