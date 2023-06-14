import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant, workspaceUser) => {
  if (workspaceUser.role !== "Owner") {
    throw new Error("User is not the owner of this workspace.");
  }

  const params = {
    TableName: process.env.FORM_TABLE,
    // 'Key' defines the partition key and sort key of the item to be removed
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      formId: event.pathParameters.formId,
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});