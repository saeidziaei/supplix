import { Bucket, Table } from "@serverless-stack/resources";

export function StorageStack({ stack }) {
  // Create an S3 bucket
  const bucket = new Bucket(stack, "Uploads", {
    cors: [
      {
        maxAge: "1 day",
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
      },
    ],
  });

  // Create the DynamoDB table
  const table = new Table(stack, "Notes2", {
    fields: {
      userId: "string",
      noteId: "string",
    },
    primaryIndex: { partitionKey: "userId", sortKey: "noteId" },
  });

  // table that holds customer customised template
  const customerISOTable = new Table(stack , "CustomerISO", {
    fields: {
      customerId: "string",
      isoId: "string", // unique id of this customised template
    },
    primaryIndex: { partitionKey: "customerId", sortKey: "isoId" },
  })
  ;
  // Return the bucket and table resources
  return {
    customerISOTable,
    table,
    bucket,
  };
}