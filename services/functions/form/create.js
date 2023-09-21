import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  const username = event.requestContext.authorizer.jwt.claims.sub;
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
      ...(data.userId ? { userId: data.userId } : {}), // this record is about this user
      formValues: data.formValues,
      // set assigneeId to -1 if not present so we can have a secondary index on it
      assigneeId: (data.formValues && data.formValues.assigneeId) ? data.formValues.assigneeId : "-1", // this record is assigned to this user
      createdBy: username,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});