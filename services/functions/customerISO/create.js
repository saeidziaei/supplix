import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);

  // TODO Check this user can make changes for this customer
  // const isAssociated = await isIdentityAssociatedWithCustomer() || user is admin
  if (!isAssociated) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  
  const params = {
    TableName: process.env.CUSTOMER_ISO_TABLE,
    Item: {
      customerId: event.pathParameters.customerId, // Parsed from request path
      isoId: uuid.v1(), // A unique uuid
      content: data.content, // Parsed from request body
      parameters: data.parameters, // Parsed from request body , values provided for parameters
      templateId: data.templateId, // Parsed from request body
      userId: event.requestContext.authorizer.iam.cognitoIdentity.identityId,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});

const isIdentityAssociatedWithCustomer = async (identityId, customerId) => {
  const params = {
    TableName: "associations",
    KeyConditionExpression: "identityId = :identityId and customerId = :customerId",
    ExpressionAttributeValues: {
      ":identityId": identityId,
      ":customerId": customerId,
    },
  };

  try {
    const result = await dynamoDb.get(params);
    return result.Count > 0;
  } catch (error) {
    console.error(error);
    return false;
  }
};




