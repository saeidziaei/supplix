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

  


  const customerTable = new Table(stack, "Customer", {
    fields: {
      customerId: "string",
    },
    primaryIndex: { partitionKey: "customerId" },
  });

  // table that holds customer customised template
  const customerISOTable = new Table(stack , "CustomerISO", {
    fields: {
      customerId: "string",
      isoId: "string", // unique id of this customised template
    },
    primaryIndex: { partitionKey: "customerId", sortKey: "isoId" },
  });

  const formTable = new Table(stack , "Form", {
    fields: {
      customerIsoId: "string",
      formId: "string", 
    },
    primaryIndex: { partitionKey: "customerIsoId", sortKey: "formId" },
  });

  // Return the bucket and table resources
  return {
    customerTable,
    customerISOTable,
    formTable,
    bucket,
  };
}