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
      contact: data.contact,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params);

  return params.Item;
}, TOP_LEVEL_ADMIN_GROUP);