import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.NTEMPLATE_TABLE,
    KeyConditionExpression: "tenant = :tenant",
    ExpressionAttributeValues: {
      ":tenant": tenant,
    },
  };
  const result = await dynamoDb.query(params);

  const templates = result.Items;
  const promises = templates.map(async (template) => {
    const formCount = await getFormCount(tenant, template.templateId);
    template.formCount = formCount;
    return template;
  });

  return Promise.all(promises);
});

async function getFormCount(tenant, templateId) {
  const params = {
    TableName: process.env.NFORM_TABLE,
    FilterExpression: "tenant = :tenant and templateId = :templateId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":templateId": templateId,
    },
  };

  const result = await dynamoDb.scan(params);
  return result.Count;
}
