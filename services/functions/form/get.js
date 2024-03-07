import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import s3 from "../../util/s3";
import isSystemTemplate  from "../../util/systemTemplates";

export const main = handler(async (event, tenant, workspaceUser) => {
  const params = {
    TableName: process.env.FORM_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      formId: event.pathParameters.formId, 
    },
  };

  const result = await dynamoDb.get(params);
  const form = result.Item;
  if (!form) {
    throw new Error("Item not found.");
  }
  
  if (!isSystemTemplate(form.templateId)) {
    form.template = await getTemplate(
      tenant,
      form.templateId,
      form.templateVersion
    );
    if (!form.template) {
      throw new Error("Template used for this form not found.");
    }
  }


  if (form.formValues && form.formValues.attachments && form.formValues.attachments.length > 0) {
    const promises = form.formValues.attachments.map(async (attachment) => {
      const s3params = {
        Bucket: process.env.BUCKET,
        Key: `private/${tenant}/${attachment.fileName}`,
        Expires: 15 * 60, // 15 minutes
      };
      const fileURL = await s3.getSignedUrlForGet(s3params);
      attachment.fileURL = fileURL;
      return attachment;
    });
    
    form.formValues.attachments = await Promise.all(promises);
  }

  return form;
});

export async function getTemplate(tenant, templateId, templateVersion) {
  const params = {
    TableName: process.env.TEMPLATE_TABLE,
    Key: {
      tenant: tenant, 
      templateId: templateId, 
    },
  };

  const result = await dynamoDb.get(params);
  const template = result.Item;

  if (!template) {
    return null; // Template not found
  }

  const getVersionNumber = (version) => (!version ? 0 : version); // returns 0 for any of 0, null or undefined 

  const templateVersionNumber = getVersionNumber(templateVersion);

  
  if (getVersionNumber(template.templateVersion) == templateVersionNumber) {
    return template;
  }

  if (template.history && Array.isArray(template.history)) {
    const templateInHistory = template.history.find(entry => getVersionNumber(entry.templateVersion) === templateVersionNumber);
    return templateInHistory;
  }

  


}
