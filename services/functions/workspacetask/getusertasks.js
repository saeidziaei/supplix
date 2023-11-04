import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  // if ADMIN is calling the call could be for any user. For normal usres they see their tasks only so get userId from the context
  const userId = event.pathParameters && event.pathParameters.username ? event.pathParameters.username : event.requestContext.authorizer.jwt.claims.sub;
  
  const { showAll } = event.queryStringParameters || {};

  const params = {
    TableName: process.env.WORKSPACETASK_TABLE,
    IndexName: "userIndex",
    KeyConditionExpression: "tenant = :tenant AND userId = :userId",
    FilterExpression: "isRecurring <> :isRecurringValue", // Exclude items where isRecurring is "Y"
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":userId": userId,
      ":isRecurringValue": "Y", // Value to filter out
    },
  };

  if (showAll !== "true") {
    // Exclude completed tasks
    params.FilterExpression += " AND taskStatus <> :completed AND taskStatus <> :cancelled";
    params.ExpressionAttributeValues[":completed"] = "Completed";
    params.ExpressionAttributeValues[":cancelled"] = "Cancelled";
  }
  const result = await dynamoDb.query(params);

  return result.Items;
});
