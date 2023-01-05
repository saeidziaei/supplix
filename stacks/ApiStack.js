import { Api, use } from "@serverless-stack/resources";
import { StorageStack } from "./StorageStack";

// TODO remove table and /notes paths
export function ApiStack({ stack, app }) {
  const { table, customerTable, customerISOTable } = use(StorageStack);

  // Create the API
  const api = new Api(stack, "Api", {
    defaults: {
      authorizer: "iam", 
      function: {
        permissions: [table, customerTable, customerISOTable], // TODO give permissions only to the endpoints that need it
        environment: {
          TABLE_NAME: table.tableName,
          CUSTOMER_TABLE: customerTable.tableName,
          CUSTOMER_ISO_TABLE: customerISOTable.tableName,
        },
      },
    },
    routes: {
      "POST   /notes": "functions/create.main", 
      "GET /notes": "functions/list.main",
      "GET /notes/{id}": "functions/get.main",
      "PUT /notes/{id}": "functions/update.main",
      "DELETE /notes/{id}": "functions/delete.main",

      "GET /customers": "functions/customer/list.main",
      "POST   /customers": "functions/customer/create.main",
      "GET /customers/{id}": "functions/customer/get.main",
      "PUT /customers/{id}": "functions/customer/update.main",
      // "DELETE /customers/{id}": "functions/customer/delete.main",

      "POST   /customers/{customerId}/iso": "functions/customerISO/create.main",

    },
  });

  // Show the API endpoint in the output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  // Return the API resource
  return {
    api,
  };
}