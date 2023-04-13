import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {

  // Check the user is the owner in this workspace
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.WORKSPACEUSER_TABLE,
    Item: {
      tenant: tenant,
      workspaceId: event.pathParameters.workspaceId, 
      userId: data.userId,
      role: data.role,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), 
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});