import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const contractorCompanyId = event.pathParameters.contractorCompanyId; 

  const params = {
    TableName: process.env.CONTRACTOR_TABLE,
    KeyConditionExpression: "tenant_contractorCompanyId = :tenant_contractorCompanyId",
    ExpressionAttributeValues: {
      ":tenant_contractorCompanyId": `${tenant}_${contractorCompanyId}`,
    },
  };

  const result = await dynamoDb.query(params);

  return result.Items;
});
