import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.WORKSPACE_TABLE,
    Item: {
      tenant: tenant,
      workspaceId: uuid.v1(), 
      workspaceName: data.workspaceName,
      workspaceStatus: data.workspaceStatus || "",
      category: data.category || "",
      subCategory: data.subCategory || "",
      clientName: data.clientName || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      note: data.note || "",
      
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), 
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});