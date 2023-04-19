import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  if (workspaceUser.role !== "Owner") {
    throw new Error("User is not the owner of this workspace.");
  }

  const workspaceId = event.pathParameters.workspaceId;
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceId}`,
      userId: event.pathParameters.userId
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});