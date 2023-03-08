import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.TENANT_TABLE,
    Item: {
      tenantId: uuid.v1(), // A unique uuid
      tenantName: data.tenantName, 
      contactPerson: data.contactPerson,
      contactEmail: data.contactEmail,
      contactNumber: data.contactNumber,
      website: data.website,
      note: data.note,
      logo: data.logo,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params); 

  return params.Item;
});