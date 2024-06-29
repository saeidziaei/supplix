import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";

export const main = handler(async (event, tenant, workspaceUser) => {
  const workspaceId = event.pathParameters.workspaceId;
  const userId = event.requestContext.authorizer.jwt.claims.sub; // The specific user ID

  const params = {
    TableName: process.env.WORKSPACEINOUT_TABLE,
    IndexName: "tenant_ws_user_Index", // Using the global secondary index
    KeyConditionExpression: "tenant_workspaceId = :tenant_workspaceId AND userId = :userId",
    FilterExpression: "attribute_not_exists(outAt)",
    ExpressionAttributeValues: {
      ":tenant_workspaceId": `${tenant}_${workspaceId}`,
      ":userId": userId,
    },
    // ProjectionExpression can be added to limit the fields returned
  };

  const result = await dynamoDb.query(params);

  if (result.Items.length === 0) {
    return null;
  }

  // Sort items by inDate in descending order and get the latest one
  const latestRecord = result.Items.sort((a, b) => b.inDate - a.inDate)[0];

  return latestRecord;
});





export async function getInoutRecordsByDate(tenant, workspaceId, date) {
  const tenantWorkspaceId = `${tenant}_${workspaceId}`;

  const startDateTime = new Date(date);
  startDateTime.setHours(0, 0, 0, 0);
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(23, 59, 59, 999);

  const params = {
    TableName: process.env.WORKSPACEINOUT_TABLE,
    IndexName: 'tenant_inat_Index', // GSI name
    KeyConditionExpression: 'tenant = :tenant AND inAt BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':tenant': tenant,
      ':start': startDateTime.getTime(),
      ':end': endDateTime.getTime()
    }
  };

  if (workspaceId) {
    params.FilterExpression = 'workspaceId = :workspaceId';
    params.ExpressionAttributeValues[':workspaceId'] = workspaceId;
  }

  const result = await dynamoDb.query(params);
  return result.Items;
}
