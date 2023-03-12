import { Bucket, Table } from "sst/constructs";
import * as cdk from 'aws-cdk-lib';
import * as cr from 'aws-cdk-lib/custom-resources';

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

 
  const isoTable = new Table(stack , "Iso", {
    fields: {
      tenant: "string",
      isoId: "string", // unique id of this customised template
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "isoId" }, 
  });

  const formTable = new Table(stack , "Form", { 
    fields: {
      tenant: "string",
      formId: "string", 
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "formId" },
  });

  const templateTable = new Table(stack , "Template", {
    fields: {
      tenant: "string",
      templateId: "string", 
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "templateId" },
  });

  // const processTable = new Table(stack , "Process", {
  //   fields: {
  //     customerIsoId: "string",
  //     processId: "string", 
  //   },
  //   primaryIndex: { partitionKey: "customerIsoId", sortKey: "processId" },
  // });

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
    isoTable,
    formTable,
    templateTable,
    docTable,
    bucket,
    nformTable,
    ntemplateTable
  };
}