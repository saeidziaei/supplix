import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const contractorId = event.pathParameters.contractorId;
  const contractorCompanyId = event.pathParameters.contractorCompanyId; // Assuming you also need this for the composite key

  const params = {
    TableName: process.env.CONTRACTOR_TABLE,
    Key: {
      tenant_contractorCompanyId: `${tenant}_${contractorCompanyId}`,
      contractorId: contractorId,
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }
  // Return the retrieved item
  return result.Item;
});
