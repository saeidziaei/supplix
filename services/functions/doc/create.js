import * as uuid from "uuid";
import dynamoDb from "../../util/dynamodb";
import handler from "../../util/handler";

export const main = handler(async (event, tenant, workspaceUser) => {

  const data = JSON.parse(event.body);
  const params = {
    TableName: process.env.DOC_TABLE,
    Item: {
      tenant: tenant,
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      docId: uuid.v1(), // A unique uuid
      fileName: data.fileName, // name of the file
      category: data.category, 
      note: data.note,
      createdBy: event.requestContext.authorizer.jwt.claims.sub,
      createdAt: Date.now(), // Current Unix timestamp
    },
  };

  await dynamoDb.put(params); 

  return params.Item;
});