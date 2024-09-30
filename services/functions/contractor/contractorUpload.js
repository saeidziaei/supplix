import * as uuid from "uuid";
import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";
import s3 from "../../util/s3";
import { sendEmail } from "../../util/email";

const getSignedUrlForUpload = async (tenant, uploadId, uploadName) => {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `private/${tenant}/contractors/${uploadId}/${uploadName}`,
    Expires: 60 * 60 * 24 * 7, // 7 days
  };
  const preSignedURL = await s3.getSignedUrlForPut(params);

  return preSignedURL;
}

// Create contractor upload
export const createUpload = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const contractorId = event.pathParameters.contractorId;
  const contractorCompanyId = event.pathParameters.contractorCompanyId;
  const uploadId = uuid.v1();
  const uploadName = encodeURIComponent(data.uploadName);
  const s3Url = await getSignedUrlForUpload(tenant, uploadId, uploadName);

  // Fetch contractor details to get the email address
  const contractorParams = {
    TableName: process.env.CONTRACTOR_TABLE,
    Key: {
      tenant_contractorCompanyId: `${tenant}_${contractorCompanyId}`,
      contractorId: contractorId,
    },
  };

  const contractor = await dynamoDb.get(contractorParams);
  
  if (!contractor.Item) {
    throw new Error("Contractor not found");
  }

  const user = contractor.Item;
  const stage = process.env.STAGE;

  const params = {
    TableName: process.env.CONTRACTOR_UPLOAD_TABLE,
    Item: {
      tenant: tenant,
      contractorId: contractorId,
      tenant_contractorId: `${tenant}_${contractorId}`, // Composite key for partition
      uploadId: uploadId, // Unique ID for the upload
      uploadName: uploadName, // Name of the uploaded document
      uploadType: data.uploadType || "", // Type of document (optional)
      project: data.project || "", // Associated project (optional)
      status: data.status || "Requested", // Upload status (optional)
      s3Url: s3Url,
      expiryDate: data.expiryDate || "", // Expiry date (optional)
      createdAt: Date.now(), // Timestamp of the upload
      createdBy: event.requestContext.authorizer.jwt.claims.sub, // User who created the upload
    },
  };

  await dynamoDb.put(params);
  // Send an email to the contractor
  const buttonLink = `https://app.isocloud.com.au/upload?s3Url=${encodeURIComponent(s3Url)}&uploadName=${uploadName}`;
  const to = stage === "prod" ? user.email : "support@isocloud.com.au";
  const body = `
  <html>
    <body>
      <p>Hi ${user.name},</p>
      <p>A new document upload task is assigned to you. Please upload <strong>${data.uploadName}</strong> using the following link:</p>
      <a href="${buttonLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-align: center; text-decoration: none; border-radius: 5px;">
        Upload Document
      </a>
      <p>${stage === "prod" ? "" : `Stage: ${stage}\n\nShould have been sent to ${user.email}`}</p>
    </body>
  </html>
`;
  const subject = "New Document Upload Task Assigned";

  await sendEmail(to, subject, body);

  return params.Item;
});

// List contractor uploads
export const listUploads = handler(async (event, tenant) => {
  const contractorId = event.pathParameters.contractorId;

  const params = {
    TableName: process.env.CONTRACTOR_UPLOAD_TABLE,
    KeyConditionExpression: "tenant_contractorId = :tenant_contractorId",
    ExpressionAttributeValues: {
      ":tenant_contractorId": `${tenant}_${contractorId}`, // Composite partition key
    },
  };

  const result = await dynamoDb.query(params);
  return result.Items;
});

// Get a single contractor upload by ID
export const getUpload = handler(async (event, tenant) => {
  const contractorId = event.pathParameters.contractorId;
  const uploadId = event.pathParameters.uploadId;

  const params = {
    TableName: process.env.CONTRACTOR_UPLOAD_TABLE,
    Key: {
      tenant_contractorId: `${tenant}_${contractorId}`, // Composite partition key
      uploadId: uploadId, // Sort key
    },
  };

  const result = await dynamoDb.get(params);
  if (!result.Item) {
    throw new Error("Upload not found.");
  }

  return result.Item;
});

// Update contractor upload
export const updateUpload = handler(async (event, tenant) => {
  const data = JSON.parse(event.body);
  const contractorId = event.pathParameters.contractorId;
  const uploadId = event.pathParameters.uploadId;

  const params = {
    TableName: process.env.CONTRACTOR_UPLOAD_TABLE,
    Key: {
      tenant_contractorId: `${tenant}_${contractorId}`, // Composite partition key
      uploadId: uploadId, // Sort key
    },
    UpdateExpression: `SET 
      uploadName = :uploadName,
      uploadType = :uploadType,
      project = :project,
      status = :status,
      expiryDate = :expiryDate,
      updatedBy = :updatedBy,
      updatedAt = :updatedAt
      `,
    ExpressionAttributeValues: {
      ":uploadName": data.uploadName,
      ":uploadType": data.uploadType || "",
      ":project": data.project || "",
      ":status": data.status || "",
      ":expiryDate": data.expiryDate || "",
      ":updatedBy": event.requestContext.authorizer.jwt.claims.sub,
      ":updatedAt": Date.now(),
    },
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamoDb.update(params);
  return result.Attributes;
});
