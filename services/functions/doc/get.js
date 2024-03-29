import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import s3 from "../../util/s3";

export const main = handler(async (event, tenant, workspaceUser) => {

  const params = {
    TableName: process.env.DOC_TABLE,
    Key: {
      tenant_workspaceId: `${tenant}_${workspaceUser.workspaceId}`, // pk
      docId: event.pathParameters.docId
    },
  };
  
  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Item not found.");
  }
  const s3params = {
    Bucket: process.env.BUCKET,
    Key: `private/${tenant}/${result.Item.fileName}`,
    Expires: 15 * 60, // 15 minutes
  };
  result.Item.fileURL = await s3.getSignedUrlForGet(s3params);

  // Return the retrieved item
  return result.Item;
});