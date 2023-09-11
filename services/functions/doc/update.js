import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.DOC_TABLE,
    
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, 
      docId: event.pathParameters.docId,
    },
    UpdateExpression: `SET 
    category = :category, 
    note= :note,
    updatedBy = :updatedBy,
    updatedAt = :updatedAt`,
    ExpressionAttributeValues: {
      ":category": data.category || "",
      ":note": data.note || "",
      ":updatedBy": event.requestContext.authorizer.jwt.claims.sub,
      ":updatedAt": Date.now(),
    },
    
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});
