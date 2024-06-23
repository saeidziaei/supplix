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
      parentId: data.parentId || null,
      workspaceName: data.workspaceName,
      workspaceStatus: data.workspaceStatus || "",
      category: data.category || "",
      workspaceCode: data.workspaceCode || "",
      clientName: data.clientName || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      note: data.note || "",
      templateCategories: data.templateCategories || [],
      hasInout: data.hasInout || false,
      siteOwner: data.siteOwner || "",
      siteAddress: data.siteAddress || "",
      inoutNote: data.inoutNote || "",
      
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), 
    },
  };

  await dynamoDb.put(params);

  return params.Item;
});