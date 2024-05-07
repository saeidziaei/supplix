import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const newTemplateDefinition = data.templateDefinition;

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
  let templateVersion = currentTemplate.templateVersion ?? 0;
  let updateExpression = "SET templateDefinition = :templateDefinition, templateVersion = :newTemplateVersion";
  let historyAttribute = {};

  if (isSignificantChange(currentTemplate.templateDefinition, newTemplateDefinition)) {
    // if title or category has changed we don't need a new version but if there is changes in the fields, we do.

    // Increment the templateVersion
    templateVersion = templateVersion + 1;

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
    updateExpression += ", history = :history";
    historyAttribute = {":history": currentTemplate.history}
  }

  // Update the template with new values
  const updateTemplateParams = {
    TableName: process.env.TEMPLATE_TABLE,
    Key: {
      tenant: tenant,
      templateId: event.pathParameters.templateId,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: {
      ":templateDefinition": newTemplateDefinition,
      ":newTemplateVersion": templateVersion,
      ...historyAttribute
    },
    ReturnValues: "ALL_NEW",
  };

  const updatedItem = await dynamoDb.update(updateTemplateParams);

  return {
    status: true,
  };
});
function isSignificantChange(oldFormDefinition, newFormDefinition) {
  const sectionsChanged =
    JSON.stringify(oldFormDefinition.sections) !==
    JSON.stringify(newFormDefinition.sections);

  // If sections have changed, it's a significant change
  return sectionsChanged;
}