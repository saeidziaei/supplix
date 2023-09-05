import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const workspaceId = event.pathParameters.workspaceId;

  const deleteWsParams = {
    TableName: process.env.WORKSPACE_TABLE,
    Key: {
      tenant: tenant,
      workspaceId: workspaceId,
    },
  };

  try {
    await deleteRecurringTasks(tenant, workspaceId);
    await dynamoDb.delete(deleteWsParams);

    return { status: true };
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return { status: false };
  }
});

async function deleteRecurringTasks(tenant, workspaceId) {
  const params = {
    TableName: process.env.WORKSPACETASK_TABLE, 
    FilterExpression: "tenant_workspaceId = :tw AND isRecurring = :isRecurring",
    ExpressionAttributeValues: {
      ":tw": `${tenant}_${workspaceId}`,
      ":isRecurring": "Y", 
    },
  };


  try {
    const result = await dynamoDb.scan(params);

    // Delete each recurring task found
    const deletePromises = result.Items.map(async (item) => {
      const deleteParams = {
        TableName: process.env.WORKSPACETASK_TABLE,
        Key: {
          tenant_workspaceId: item.tenant_workspaceId,
          taskId: item.taskId,
        },
      };

      await dynamoDb.delete(deleteParams);
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting recurring tasks:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}