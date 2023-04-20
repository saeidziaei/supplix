import handler, { getUser } from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant, workspaceUser) => {
  const username = event.requestContext.authorizer.jwt.claims.sub;
  const user = await getUser(username);

  const data = JSON.parse(event.body);

  let updateExpression = `SET 
    formValues = :formValues,
    updatedBy= :updatedBy,
    updatedByUser= :updatedByUser,
    updatedAt= :updatedAt`;

  let expressionAttributeValues = {
    ":formValues": data.formValues,
    ":updatedBy": username,
    ":updatedByUser": user,
    ":updatedAt": Date.now(),
  };

  if (data.isRevision === true) {
    const getCurrentRecordParams = {
      TableName: process.env.FORM_TABLE,
      Key: {
        tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`,
        formId: event.pathParameters.formId,
      },
    };
    const currentRecord = await dynamoDb.get(getCurrentRecordParams);

    updateExpression += `, history = list_append(if_not_exists(history, :empty_list), :history)`;
    expressionAttributeValues = {
      ...expressionAttributeValues,
      ":empty_list": [],
      ":history": [currentRecord.Item],
    };
  }

  const params = {
    TableName: process.env.FORM_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`,
      formId: event.pathParameters.formId,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  await dynamoDb.update(params);
  return { status: true };
});

