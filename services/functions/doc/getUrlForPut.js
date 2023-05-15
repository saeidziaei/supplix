import handler from "../../util/handler";
import s3 from "../../util/s3";

export const main = handler(async (event, tenant) => {

  const data = JSON.parse(event.body);
    
  // Upload the file to S3
  const params = {
    Bucket: process.env.BUCKET,
    Key: `private/${tenant}/${data.folder}/${data.fileName}`,
    ContentType:  data.contentType,
    Expires: 120, // 2 minutes
  };
  const preSignedURL = await s3.getSignedUrlForPut(params);

  return preSignedURL;
  
});