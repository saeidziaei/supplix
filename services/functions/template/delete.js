
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const params = {
    TableName: process.env.TEMPLATE_TABLE,

    Key: {
      tenant: tenant, 
      templateId: event.pathParameters.templateId, 
    },
    UpdateExpression: "SET isDeleted = :isDeleted",
    ExpressionAttributeValues: {
      ":isDeleted": true, // Set the flag to indicate logical deletion
    },
    // TODO don't think this is needed
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});