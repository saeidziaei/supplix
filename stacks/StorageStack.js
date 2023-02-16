import { Bucket, Table } from "@serverless-stack/resources";
import { tenants } from "./config";

export function StorageStack({ stack, app }) {
  // Create an S3 bucket
 
  const bucket = new Bucket(stack, "Uploads" , {
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

  const templateTable = new Table(stack , "Template", {
    fields: {
      customerIsoId: "string",
      templateId: "string", 
    },
    primaryIndex: { partitionKey: "customerIsoId", sortKey: "templateId" },
  });

  const processTable = new Table(stack , "Process", {
    fields: {
      customerIsoId: "string",
      processId: "string", 
    },
    primaryIndex: { partitionKey: "customerIsoId", sortKey: "processId" },
  });


  const nformTable = new Table(stack , "NForm", {
    fields: {
      customerId: "string",
      formId: "string", 
    },
    primaryIndex: { partitionKey: "customerId", sortKey: "formId" },
  });

  const ntemplateTable = new Table(stack , "NTemplate", {
    fields: {
      customerId: "string",
      templateId: "string", 
    },
    primaryIndex: { partitionKey: "customerId", sortKey: "templateId" },
  });

  // Return the bucket and table resources
  return {
    customerTable,
    customerISOTable,
    formTable,
    templateTable,
    processTable,
    bucket,
    nformTable,
    ntemplateTable
  };
}