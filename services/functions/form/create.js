import * as uuid from "uuid";
import handler, { getUser } from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  const username = event.requestContext.authorizer.jwt.claims.sub;
  const user = await getUser(username);

  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.FORM_TABLE,
    Item: {
      tenant: tenant,
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      formId: uuid.v1(), // A unique uuid
      templateId: data.templateId,
      formValues: data.formValues,
      createdBy: username,
      createdByUser: user,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});