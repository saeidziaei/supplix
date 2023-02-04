import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
  const params = {
    TableName: process.env.TEMPLATE_TABLE,
    KeyConditionExpression: "customerIsoId = :customerIsoId",
    ExpressionAttributeValues: {
      ":customerIsoId": event.pathParameters.customerIsoId,
    },
  };
  const result = await dynamoDb.query(params);

  const templates = result.Items;
  const promises = templates.map(async (template) => {
    const formCount = await getFormCount(template.customerIsoId, template.templateId);
    template.formCount = formCount;
    return template;
  });

  return Promise.all(promises);
});

async function getFormCount(customerIsoId, templateId) {
  const params = {
    TableName: process.env.FORM_TABLE,
    FilterExpression: "customerIsoId = :customerIsoId and templateId = :templateId",
    ExpressionAttributeValues: {
      ":customerIsoId": customerIsoId,
      ":templateId": templateId,
    },
  };

  const result = await dynamoDb.scan(params);
  return result.Count;
}
