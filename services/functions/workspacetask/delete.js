import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import { NCR_WORKSAPCE_ID } from "../../util/constants";

export const main = handler(async (event, tenant) => {
  const workspaceId = event.pathParameters.workspaceId;
  if (workspaceId === NCR_WORKSAPCE_ID) {
    throw new Error("NCR items cannot be deleted.");
  }


  const deleteParams = {
    TableName: process.env.WORKSPACETASK_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceId}`,
      taskId: event.pathParameters.taskId,
    },
  };
  await dynamoDb.delete(deleteParams);
  return { status: true };
});