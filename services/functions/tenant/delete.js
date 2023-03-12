import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
export const main = handler(async (event) => {
  const tenantId = event.pathParameters.tenantId;
  // never delete the main tenant
  if (tenantId == 'isocloud') 
    return { status: false };

  const params = {
    TableName: process.env.TENANT_TABLE,
    Key: {
      tenantId: tenantId, 
    },
  };
  await dynamoDb.delete(params);
  return { status: true };
});