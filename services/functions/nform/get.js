import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.NFORM_TABLE,
    Key: {
      tenant: tenant,
      formId: event.pathParameters.formId, 
    },
  };

  const result = await dynamoDb.get(params);
  const form = result.Item;
  if (!form) {
    throw new Error("Item not found.");
  }

  form.template = await getTemplate(form.customerIsoId, form.templateId);
  if (!form.template) {
    throw new Error("Template used for this form not found.");
  }


  return form;
});

async function getTemplate(tenant, templateId) {
  const params = {
    TableName: process.env.NTEMPLATE_TABLE,
    Key: {
      tenant: tenant, 
      templateId: templateId, 
    },
  };

  const result = await dynamoDb.get(params);
  return result.Item;
}
