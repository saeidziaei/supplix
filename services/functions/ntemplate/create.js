import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.NTEMPLATE_TABLE,
    Item: {
      customerId: event.pathParameters.customerId, 
      templateId: uuid.v1(), // A unique uuid
      templateDefinition: data.templateDefinition,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});