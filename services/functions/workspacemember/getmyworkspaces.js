import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    FilterExpression: "tenant = :tenant and userId = :userId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":userId": event.requestContext.authorizer.jwt.claims.sub,
    },
  };
  const wus = await dynamoDb.scan(params);
  if (!wus.Items)
    return [];

  const promises = wus.Items.map(async (wu) => {
    let workspace = await getWorkspaceDetail(tenant, wu.workspaceId);
    workspace.role = wu.role;
    return workspace;
  });

  return Promise.all(promises);

});

async function getWorkspaceDetail(tenant, workspaceId) {
  const params = {
    TableName: process.env.WORKSPACE_TABLE,
    Key:{
      tenant: tenant,
      workspaceId: workspaceId
    } 
  };

  const result = await dynamoDb.get(params);
  // TODO what if !result.Item 
  return result.Item;
}
