import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant) => {
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
    const formCount = await getFormCount(template.tenant, template.templateId);
    template.formCount = formCount;
    return template;
  });

  return Promise.all(promises);
});

async function getFormCount(tenant, templateId) {
  const params = {
    TableName: process.env.FORM_TABLE,
    FilterExpression: "tenant = :tenant and templateId = :templateId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":templateId": templateId,
    },
  };

  // TODO - can this be changed to query?
  const result = await dynamoDb.scan(params);
  return result.Count;
}
