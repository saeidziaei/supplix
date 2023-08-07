import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import s3 from "../../util/s3";

export const main = handler(async (event, tenant, workspaceUser) => {

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      taskId: event.pathParameters.taskId
    },
  };
  
  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }

  // Return the retrieved item
  return result.Item;
});