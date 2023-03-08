import { Bucket, Table } from "sst/constructs";
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



  const tenantTable = new Table(stack, "Tenant", {
    fields: {
      tenantId: "string",
    },
    primaryIndex: { partitionKey: "tenantId" },
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

  const docTable = new Table(stack , "Doc", {
    fields: {
      tenant: "string",
      docId: "string", 
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "docId" },
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
    tenantTable,
    customerISOTable,
    formTable,
    templateTable,
    processTable,
    docTable,
    bucket,
    nformTable,
    ntemplateTable
  };
}