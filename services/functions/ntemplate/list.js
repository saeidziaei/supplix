import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
  const params = {
    TableName: process.env.NTEMPLATE_TABLE,
    KeyConditionExpression: "customerId = :customerId",
    ExpressionAttributeValues: {
      ":customerId": event.pathParameters.customerId,
    },
  };
  const result = await dynamoDb.query(params);

  const templates = result.Items;
  const promises = templates.map(async (template) => {
    const formCount = await getFormCount(template.customerId, template.templateId);
    template.formCount = formCount;
    return template;
  });

  return Promise.all(promises);
});

async function getFormCount(customerId, templateId) {
  const params = {
    TableName: process.env.NFORM_TABLE,
    FilterExpression: "customerId = :customerId and templateId = :templateId",
    ExpressionAttributeValues: {
      ":customerId": customerId,
      ":templateId": templateId,
    },
  };

  const result = await dynamoDb.scan(params);
  return result.Count;
}
