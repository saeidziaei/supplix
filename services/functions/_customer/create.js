import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import { TOP_LEVEL_ADMIN_GROUP } from "../../util/constants";

export const main = handler(async (event) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.CUSTOMER_TABLE,
    Item: {
      customerId: uuid.v1(), // A unique uuid
      companyName: data.companyName, 
      ABN: data.ABN, 
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
      notes: data.notes,
      logo: data.logo,
    },
  };

  await dynamoDb.put(params); 

  return params.Item;
});