import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.FORM_TABLE,
    Item: {
      customerIsoId: event.pathParameters.customerIsoId, 
      formId: uuid.v1(), // A unique uuid
      formName: data.formName,
      values: data.values,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});