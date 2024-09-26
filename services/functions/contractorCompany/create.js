import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.CONTRACTOR_COMPANY_TABLE,
    Item: {
      tenant: tenant,
      contractorCompanyId: uuid.v1(), // A unique uuid
      companyName: data.companyName,
      contactPerson: data.contactPerson || "",
      contactNumber: data.contactNumber || "",
      contactEmail: data.contactEmail || "",
      ABN: data.ABN || "",
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});
