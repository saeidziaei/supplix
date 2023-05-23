import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const workspaceId = event.pathParameters.workspaceId;

// TODO this should be handled by DynamoDB Streams but for some reason CDK does not give streamARN which a lambda needs to listen to stream events so doing this for now
  const getParams = {
    TableName: process.env.WORKSPACE_TABLE,
    Key: {
      tenant: tenant, 
      workspaceId: workspaceId, 
    },
  };

  const result = await dynamoDb.get(getParams);
  if (!result.Item) {
    throw new Error("Item not found.");
  }

  const workspace = result.Item;
  const putParams = {
    TableName: process.env.DELETEDARCHIVE_TABLE,
    Item: {
      tenant: tenant,
      deletedAt: Date.now(), 
      deletedBy: event.requestContext.authorizer.jwt.claims.sub,
      recordType: "Workspace",
      record: workspace 
    },
  };

  await dynamoDb.put(putParams);

  const deleteParams = {
    TableName: process.env.WORKSPACE_TABLE,
    Key: {
      tenant: tenant,
      workspaceId: event.pathParameters.workspaceId,
    },
  };
  await dynamoDb.delete(deleteParams);
  return { status: true };
});