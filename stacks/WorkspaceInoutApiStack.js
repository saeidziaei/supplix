// import { Api, use } from "sst/constructs";
// import { StorageStack } from "./StorageStack";
// import { ADMIN_GROUP,  } from "../services/util/constants";
// import { AuthAndApiStack } from "./AuthAndApiStack";


// export function WorkspaceInoutApiStack({ stack, app }) {
//   const { workspaceInoutTable, workspaceTable } = use(StorageStack);
//   const { api, auth } = use(AuthAndApiStack);

//   api.addRoutes(stack, {


//       "POST  /workspaces/{workspaceId}/inouts": {
//         function: {
//           handler: "services/functions/workspaceinout/create.main",
//           bind: [workspaceInoutTable],
//         },
//       },
//       "GET   /workspaces/{workspaceId}/inouts/lastin": {
//         function: {
//           handler: "services/functions/workspaceinout/getlastin.main",
//           bind: [workspaceInoutTable, workspaceTable],
//         },
//       },
//       "GET   /workspaces/{workspaceId}/inouts": { // ?date={effectiveDate}
//         function: {
//           handler: "services/functions/workspaceinout/getbydate.main",
//           bind: [workspaceInoutTable, workspaceTable],
//         },
//       },
//       "PUT  /workspaces/{workspaceId}/inouts/{inoutId}": {
//         function: {
//           handler: "services/functions/workspaceinout/update.main",
//           bind: [workspaceInoutTable],
//         },
//       },

//     },
//   );
// }