import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const contractorCompanyId = event.pathParameters.contractorCompanyId; 
  const params = {
    TableName: process.env.CONTRACTOR_TABLE, // Updated table name
    Item: {
      tenant: tenant,
      contractorCompanyId: contractorCompanyId,
      tenant_contractorCompanyId: `${tenant}_${contractorCompanyId}`,
      contractorId: uuid.v1(), // A unique uuid for contractor
      name: data.name, // Contractor's name
      trade: data.trade || "", // Contractor's trade (added field)
      phone: data.phone || "", // Contractor's phone
      email: data.email || "", // Contractor's email
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});
