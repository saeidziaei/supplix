import { Api, use } from "sst/constructs";
import { StorageStack } from "./StorageStack";
import { ADMIN_GROUP,  } from "../services/util/constants";
import { AuthAndApiStack } from "./AuthAndApiStack";


export function ContractorsApiStack({ stack, app }) {
  const { contractorCompanyTable, contractorTable, contractorUploadTable } = use(StorageStack);
  const { api, auth } = use(AuthAndApiStack);

  api.addRoutes(stack, {
      "POST   /contractors/{contractorId}/upload-request": {
        function: {
          handler: "services/functions/contractor/upload.createRequest",
          bind: [contractorCompanyTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },

      "GET   /contractor-companies": {
        function: {
          handler: "services/functions/contractorCompany/list.main",
          bind: [contractorCompanyTable],
          environment: {
          },
        },
      },
      "GET   /contractor-companies/{contractorCompanyId}": {
        function: {
          handler: "services/functions/contractorCompany/get.main",
          bind: [contractorCompanyTable],
          environment: {
          },
        },
      },
      "POST   /contractor-companies": {
        function: {
          handler: "services/functions/contractorCompany/create.main",
          bind: [contractorCompanyTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "PUT   /contractor-companies/{contractorCompanyId}": {
        function: {
          handler: "services/functions/contractorCompany/update.main",
          bind: [contractorCompanyTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "DELETE   /contractor-companies/{contractorCompanyId}": {
        function: {
          handler: "services/functions/contractorCompany/delete.main",
          bind: [contractorCompanyTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },

      "GET   /contractor-companies/{contractorCompanyId}/contractors": {
        function: {
          handler: "services/functions/contractor/list.main",
          bind: [contractorCompanyTable, contractorTable],
          environment: {
          },
        },
      },
      "GET   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}":
        {
          function: {
            handler: "services/functions/contractor/get.main",
            bind: [contractorCompanyTable, contractorTable],
            environment: {
            },
          },
        },
      "POST   /contractor-companies/{contractorCompanyId}/contractors": {
        function: {
          handler: "services/functions/contractor/create.main",
          bind: [contractorTable],
          environment: {
            ALLOWED_GROUPS: ADMIN_GROUP,
          },
        },
      },
      "PUT   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}":
        {
          function: {
            handler: "services/functions/contractor/update.main",
            bind: [contractorTable],
            environment: {
              ALLOWED_GROUPS: ADMIN_GROUP,
            },
          },
        },
      "DELETE   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}":
        {
          function: {
            handler: "services/functions/contractor/delete.main",
            bind: [contractorTable],
            environment: {
              ALLOWED_GROUPS: ADMIN_GROUP,
            },
          },
        },

        "POST   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}/uploads": {
          function: {
            handler: "services/functions/contractor/contractorUpload.createUpload",
            bind: [contractorTable, contractorUploadTable],
            environment: {
              ALLOWED_GROUPS: ADMIN_GROUP,
            },
          },
        },
        "GET   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}/uploads": {
          function: {
            handler: "services/functions/contractor/contractorUpload.listUploads",
            bind: [contractorUploadTable],
          },
        },
        "GET   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}/uploads/{uploadId}": {
          function: {
            handler: "services/functions/contractor/contractorUpload.getUpload",
            bind: [contractorUploadTable],
          },
        },
        "PUT   /contractor-companies/{contractorCompanyId}/contractors/{contractorId}/uploads/{uploadId}": {
          function: {
            handler: "services/functions/contractor/contractorUpload.updateUpload",
            bind: [contractorUploadTable],
            environment: {
              ALLOWED_GROUPS: ADMIN_GROUP,
            },
          },
        },
        
    },
  );
}