import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.WORKSPACE_TABLE,
    Key: {
      tenant: tenant,
      workspaceId: event.pathParameters.workspaceId,
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});