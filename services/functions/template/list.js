import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant, workspaceUser) => {
  const params = {
    TableName: process.env.TEMPLATE_TABLE,
    KeyConditionExpression: "tenant = :tenant",
    ExpressionAttributeValues: {
      ":tenant": tenant,
    },
  };
  const result = await dynamoDb.query(params);

  const templates = result.Items;
  const promises = templates.map(async (template) => {
    const formCount = await getFormCount(tenant, workspaceUser.workspaceId, template.templateId);
    template.formCount = formCount;
    return template;
  });

  return Promise.all(promises);
});

async function getFormCount(tenant, workspaceId, templateId) {
  const params = {
    TableName: process.env.FORM_TABLE,
    KeyConditionExpression: "tenant_workspaceId = :tenant_workspaceId",
    FilterExpression: "templateId = :templateId",
    ExpressionAttributeValues: {
      ":tenant_workspaceId": `${tenant}_${workspaceUser.workspaceId}`,
      ":templateId": templateId,
    },
  };

  // TODO Consider a secondary index on templateId
  const result = await dynamoDb.query(params);
  return result.Count;
}
