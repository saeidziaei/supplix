import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const workspaceId = event.pathParameters.workspaceId;

    const params = {
    TableName: process.env.WORKSPACEINOUT_TABLE,
    
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceId}`, 
      inoutId: event.pathParameters.inoutId,
    },
    UpdateExpression: `SET 
    outAt = :outAt, 
    updatedBy = :updatedBy,
    updatedAt = :updatedAt`,
    ExpressionAttributeValues: {
      ":outAt": Date.now(),
      ":updatedBy": event.requestContext.authorizer.jwt.claims.sub,
      ":updatedAt": Date.now(),
    },
    
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };


});

