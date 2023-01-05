import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.CUSTOMER_TABLE,
    // 'Key' defines the partition key and sort key of the item to be updated
    Key: {
      customerId: event.pathParameters.id, 
    },
    // 'UpdateExpression' defines the attributes to be updated
    // 'ExpressionAttributeValues' defines the value in the update expression
    UpdateExpression: `SET 
      companyName = :companyName, 
      ABN = :ABN, 
      contact = :contact,
      updatedBy = :updatedBy,
      updatedAt = :updatedAt`,
    ExpressionAttributeValues: {
      ":companyName": data.companyName || null,
      ":ABN": data.ABN || null,
      ":contact": data.companyName || null,
      ":updatedBy": event.requestContext.authorizer.iam.cognitoIdentity.identityId,
      ":updatedAt": Date.now(), 

    },
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});