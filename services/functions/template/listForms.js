import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant, workspaceUser) => {
  const params = {
    TableName: process.env.FORM_TABLE,

    KeyConditionExpression: "tenant_workspaceId = :tenant_workspaceId",
    FilterExpression: "templateId = :templateId",
    ExpressionAttributeValues: {
      ":tenant_workspaceId": `${tenant}_${workspaceUser.workspaceId}`,
      ":templateId": event.pathParameters.templateId,
    },
  };
  const result = await dynamoDb.query(params);

  return result.Items;

});

