import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);

  const params = {
    TableName: process.env.CONTRACTOR_TABLE,
    Key: {
      tenant_contractorCompanyId: `${tenant}_${data.contractorCompanyId}`,
      contractorId: data.contractorId,
    },
    UpdateExpression: `SET 
      name = :name,
      trade = :trade,
      phone = :phone,
      email = :email,
      updatedBy = :updatedBy,
      updatedAt = :updatedAt
      `,
    ExpressionAttributeValues: {
      ":name": data.name,
      ":trade": data.trade || "",
      ":phone": data.phone || "",
      ":email": data.email || "",
      ":updatedBy": event.requestContext.authorizer.jwt.claims.sub,
      ":updatedAt": Date.now(),

    },
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDb.update(params);

  return result.Attributes;
});
