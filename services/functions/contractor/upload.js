import { sendEmail } from "../../util/email";
import s3 from "../../util/s3";

export const createRequest = handler(async (event, tenant) => {
    const data = JSON.parse(event.body);
    const contractorId = event.pathParameters.contractorId;

    // get pre signed URL
    const params = {
        Bucket: process.env.BUCKET,
        Key: `private/${tenant}/contractors/${contractorId}/`,
        Expires: 60 * 60 * 24 * 2, // 2 days
      };
      const preSignedURL = await s3.getSignedUrlForPut(params);
    
      console.log("Presigned URL", preSignedURL);

const domain = process.env.DOMAIN || "localhost:3000";
    const to = "support@isocloud.com.au";
    const body = `Hi \n\nPlease click <a href="${domain}/upload?psu=${preSignedURL}">here</a> to upload.\n\n
    Upload Type: ${data.docType}`;
    const subject = "New Upload Request";

    const ret = await sendEmail(to, subject, body);
  
    console.log("Email sent successfully", ret);
});