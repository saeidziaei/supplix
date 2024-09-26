import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const contractorCompanyId = event.pathParameters.contractorCompanyId;

  const params = {
    TableName: process.env.CONTRACTOR_COMPANY_TABLE,
    Key: {
      tenant: tenant,
      contractorCompanyId: contractorCompanyId,
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});
