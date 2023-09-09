import * as uuid from "uuid";
import handler, { getUser } from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  const username = event.requestContext.authorizer.jwt.claims.sub;
  const user = await getUser(username);
  const workspaceId = workspaceUser.workspaceId;

  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.FORM_TABLE,
    Item: {
      tenant: tenant,
      workspaceId: workspaceId,
      tenant_workspaceId: `${tenant}_${workspaceId}`, // pk
      formId: uuid.v1(), // A unique uuid
      templateId: data.templateId,
      templateVersion: data.templateVersion || 0,
      ...(data.userId ? { userId: data.userId } : {}),
      formValues: data.formValues,
      createdBy: username,
      createdByUser: user,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});