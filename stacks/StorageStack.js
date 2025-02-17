import { Bucket, Table } from "sst/constructs";


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
  
  const userTable = new Table(stack, "User", {
    fields: {
      tenant: "string",
      Username: "string",
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "Username" },

  });

  const contractorCompanyTable = new Table(stack, "ContractorCompany", {
    fields: {
      tenant: "string",
      contractorCompanyId: "string",
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "contractorCompanyId" },

  });

  const contractorTable = new Table(stack, "Contractor", {
    fields: {
      tenant: "string",
      contractorCompanyId: "string",
      tenant_contractorCompanyId: "string",
      contractorId: "string",
    },
    primaryIndex: { partitionKey: "tenant_contractorCompanyId", sortKey: "contractorId" },

  });

  const contractorUploadTable = new Table(stack, "ContractorUpload", {
    fields: {
      tenant: "string",
      contractorId: "string",
      tenant_contractorId: "string",
      uploadId: "string",
    },
    primaryIndex: { partitionKey: "tenant_contractorId", sortKey: "uploadId" },

  });

  const workspaceTable = new Table(stack, "Workspace", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      name: "string",
      parentId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "workspaceId" },
    stream: "new_and_old_images",
  });


  const deletedArchiveTable = new Table(stack, "DeletedArchive", {
    fields: {
      tenant: "string",
      deletedAt: "number",
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "deletedAt" },
  });


  const workspaceTaskTable = new Table(stack, "WorkspaceTask", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      taskId: "string",
      userId: "string",
      isRecurring: "string",
      endDate: "number",
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "taskId" },
    globalIndexes: {
      userIndex: { partitionKey: "tenant", sortKey: "userId" },
      isRecurringIndex: { partitionKey: "isRecurring" },
    },
    stream: "new_and_old_images",
  });  
  
  const workspaceInoutTable = new Table(stack, "WorkspaceInout", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      inoutId: "string",
      userId: "string",
      inAt: "number",
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "inoutId" },
    globalIndexes: {
      tenant_ws_user_Index: { partitionKey: "tenant_workspaceId", sortKey: "userId" },
      tenant_user_Index: { partitionKey: "tenant", sortKey: "userId" },
      tenant_inat_Index: { partitionKey: "tenant", sortKey: "inAt" },
    },
  });


   
  const workspaceUserTable = new Table(stack, "WorkspaceUser", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      userId: "string", 
      role: "string", // owner or member
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "userId" }, 
  })
 
  const isoTable = new Table(stack , "Iso", {
    fields: {
      tenant: "string",
      isoId: "string", // unique id of this customised template
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "isoId" }, 
  });

  const formTable = new Table(stack, "Form", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string", 
      formId: "string",
      userId: "string" // when the record is directly related to a user. i.e. a certificate this employee has
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "formId" },
    globalIndexes: {
      userIndex: { partitionKey: "tenant", sortKey: "userId" },
    },
    stream: "new_and_old_images",
  });

  const templateTable = new Table(stack , "Template", {
    fields: {
      tenant: "string",
      templateId: "string", 
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "templateId" },
  });


  const docTable = new Table(stack , "Doc", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      tenant_workspaceId: "string",
      docId: "string", 
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "docId" },
  });

  const stripeEventTable = new Table(stack , "StripeEvent", {
    fields: {
      stripeEventId: "string", // this prevents doulbe processing of a duplicate stripe event
    },
    primaryIndex: { partitionKey: "stripeEventId" },
    stream: "new_image",
  });
  
  return { 
    tenantTable,
    userTable,
    isoTable,
    templateTable,
    formTable,
    docTable,
    workspaceTable,
    workspaceUserTable,
    workspaceTaskTable,
    workspaceInoutTable, 
    deletedArchiveTable,
    stripeEventTable,
    contractorCompanyTable,
    contractorTable,
    contractorUploadTable,
    bucket,
  };
}