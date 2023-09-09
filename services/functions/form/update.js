import handler, { getUser } from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import s3 from "../../util/s3";

export const main = handler(async (event, tenant, workspaceUser) => {
  const username = event.requestContext.authorizer.jwt.claims.sub;
  const user = await getUser(username);

  const data = JSON.parse(event.body);

  if (data.formValues && data.formValues.deletedAttachments) {
    for (const attachment of data.formValues.deletedAttachments) {
      await removeS3Object(tenant, attachment.fileName);
    }
    delete data.formValues.deletedAttachments;
  }

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

    updateExpression += `, history = list_append(if_not_exists(history, :empty_list), :current_record)`;
    expressionAttributeValues = {
      ...expressionAttributeValues,
      ":empty_list": [],
      ":current_record": [currentRecord.Item],
    };
  }


  if (data.userId) {
    updateExpression += `, userId = :userId`;
    expressionAttributeValues = {
      ...expressionAttributeValues,
      ":userId": data.userId,
    }
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

async function removeS3Object(tenant, fileName) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `private/${tenant}/${fileName}`,
  };

  await s3.deleteObject(params);
}

