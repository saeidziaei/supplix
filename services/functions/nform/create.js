import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.NFORM_TABLE,
    Item: {
      customerId: event.pathParameters.customerId, 
      formId: uuid.v1(), // A unique uuid
      templateId: data.templateId,
      formValues: data.formValues,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});