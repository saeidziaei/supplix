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
  
  const workspaceTable = new Table(stack, "Workspace", {
    fields: {
      tenant: "string",
      workspaceId: "string",
      name: "string",
      parentId: "string"
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "workspaceId" },
    // globalIndexes: [
    //   { partitionKey: "tenant", sortKey: "parentId"}
    // ]
  });


  const deletedArchiveTable = new Table(stack, "DeletedArchive", {
    fields: {
      tenant: "string",
      deletedAt: "number",
    },
    primaryIndex: { partitionKey: "tenant", sortKey: "deletedAt" },
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
    },
    primaryIndex: { partitionKey: "tenant_workspaceId", sortKey: "formId" },
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


  
  return { 
    tenantTable,
    userTable,
    isoTable,
    templateTable,
    formTable,
    docTable,
    workspaceTable,
    workspaceUserTable,
    deletedArchiveTable,
    bucket,
  };
}