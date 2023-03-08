import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.CUSTOMER_TABLE,
    
    Key: {
      customerId: event.pathParameters.customerId, 
    },
    UpdateExpression: `SET 
      companyName = :companyName, 
      ABN = :ABN, 
      contactName= :contactName,
      contactEmail= :contactEmail,
      contactPhone= :contactPhone,
      notes= :notes,
      logo= :logo`,
    ExpressionAttributeValues: {
      ":companyName": data.companyName,
      ":ABN": data.ABN  || null,
      ":contactName": data.contactName  || null,
      ":contactEmail": data.contactEmail  || null,
      ":contactPhone": data.contactPhone  || null,
      ":notes": data.notes  || null,
      ":logo": data.logo  || null,
    },
    
    // 'ReturnValues' specifies if and how to return the item's attributes,
    // where ALL_NEW returns all attributes of the item after the update; you
    // can inspect 'result' below to see how it works with different settings
    ReturnValues: "ALL_NEW",
  };
  await dynamoDb.update(params);
  return { status: true };
});