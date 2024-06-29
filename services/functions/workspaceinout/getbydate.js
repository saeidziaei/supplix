import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";

export const main = handler(async (event, tenant, workspaceUser) => {
  const workspaceId = event.pathParameters.workspaceId;
  const effectiveDate = event.queryStringParameters.effectiveDate; // Expected format: YYYY-MM-DD


  // Validate the effectiveDate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid date format. Use YYYY-MM-DD." }),
    };
  }

  // Convert effectiveDate to start and end timestamps for the day
  const startDate = new Date(`${effectiveDate}T00:00:00Z`).getTime();
  const endDate = new Date(`${effectiveDate}T23:59:59Z`).getTime();

  console.log(startDate, typeof(startDate));

  console.log(startDate, endDate, new Date());

  const params = {
    TableName: process.env.WORKSPACEINOUT_TABLE,
    IndexName: "tenant_inat_Index",
    KeyConditionExpression: "tenant = :tenant AND inAt BETWEEN :startDate AND :endDate",
    FilterExpression: "workspaceId = :workspaceId",
    ExpressionAttributeValues: {
      ":tenant": tenant,
      ":workspaceId": workspaceId,
      ":startDate": startDate,
      ":endDate": endDate
    },
  };

  const result = await dynamoDb.query(params);

  return result.Items;
});
