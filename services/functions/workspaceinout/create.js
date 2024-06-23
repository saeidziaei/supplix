import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";
import * as uuid from "uuid";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);

  const workspaceId = event.pathParameters.workspaceId;
  let item = {
    tenant_workspaceId: `${tenant}_${workspaceId}`, // pk
    tenant: tenant,
    inoutId: uuid.v1(),
    workspaceId: workspaceId,
    userId: event.requestContext.authorizer.jwt.claims.sub,
    inAt: data.inAt || Date.now(),
    createdBy: event.requestContext.authorizer.jwt.claims.sub,
    createdAt: Date.now(),
  };

  
  const params = {
    TableName: process.env.WORKSPACEINOUT_TABLE,
    Item: item,
  };

  await dynamoDb.put(params);

  return params.Item;
});