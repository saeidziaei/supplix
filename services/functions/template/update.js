import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);

  // Fetch the current template
  const getCurrentTemplateParams = {
    TableName: process.env.TEMPLATE_TABLE,
    Key: {
      tenant: tenant,
      templateId: event.pathParameters.templateId,
    },
  };
  const currentTemplateResult = await dynamoDb.get(getCurrentTemplateParams);
  const currentTemplate = currentTemplateResult.Item;

  // If the template doesn't have a history array, create one
  if (!currentTemplate.history) {
    currentTemplate.history = [];
  }

  // Push the current template to the history array
  currentTemplate.history.push({
    tenant: currentTemplate.tenant,
    templateId: currentTemplate.templateId,
    templateVersion: currentTemplate.templateVersion || 0,
    templateDefinition: currentTemplate.templateDefinition,
  });

  // Increment the templateVersion if it exists, or set to 1 if it doesn't
  const newTemplateVersion = (currentTemplate.templateVersion ?? 0) + 1;

  // Update the template with new values
  const updateTemplateParams = {
    TableName: process.env.TEMPLATE_TABLE,
    Key: {
      tenant: tenant,
      templateId: event.pathParameters.templateId,
    },
    UpdateExpression: "SET templateDefinition = :templateDefinition, templateVersion = :newTemplateVersion, history = :history",
    ExpressionAttributeValues: {
      ":templateDefinition": data.templateDefinition,
      ":newTemplateVersion": newTemplateVersion,
      ":history": currentTemplate.history,
    },
    ReturnValues: "ALL_NEW",
  };

  const updatedItem = await dynamoDb.update(updateTemplateParams);

  return {
    status: true,
  };
});
