import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.TENANT_TABLE,
    
    Key: {
      tenantId: event.pathParameters.tenantId, 
    },
    UpdateExpression: `SET 
    tenantName = :tenantName, 
      contactPerson= :contactPerson,
      contactEmail= :contactEmail,
      contactNumber= :contactNumber,
      note= :note,
      logo= :logo`,
    ExpressionAttributeValues: {
      ":tenantName": data.tenantName,
      ":contactPerson": data.contactPerson,
      ":contactEmail": data.contactEmail,
      ":contactNumber": data.contactNumber,
      ":note": data.note,
      ":logo": data.logo,
    },
    
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});