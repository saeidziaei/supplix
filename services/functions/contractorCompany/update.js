import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event,tenant) => {
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.CONTRACTOR_COMPANY_TABLE,
    Key: {
      tenant: tenant,
      contractorCompanyId: event.pathParameters.contractorCompanyId,
    },
    UpdateExpression: `SET 
      companyName = :companyName,
      contactPerson = :contactPerson, 
      contactNumber = :contactNumber, 
      contactEmail = :contactEmail, 
      ABN = :ABN
      `,
    ExpressionAttributeValues: {
      ":companyName": data.companyName,
      ":contactPerson": data.contactPerson || "",
      ":contactNumber": data.contactNumber || "",
      ":contactEmail": data.contactEmail || "",
      ":ABN": data.ABN || "",
    },
    ReturnValues: "ALL_NEW",
  };

  await dynamoDb.update(params);
  return { status: true };
});
