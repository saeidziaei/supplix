import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const { contractorCompanyId, contractorId } = event.pathParameters;

  const params = {
    TableName: process.env.CONTRACTOR_TABLE, // Updated table name
    Key: {
      tenant_contractorCompanyId: `${tenant}_${contractorCompanyId}`, // Composite key with tenant and contractorCompanyId
      contractorId: contractorId, // The unique contractor ID
    },
  };

  await dynamoDb.delete(params);

  return { status: true };
});
