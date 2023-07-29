import handler from "../../util/handler";
import dynamoDb from "../../util/dynamodb";

export const main = handler(async (event, tenant) => {
  // return await getWorkspaceById(event.pathParameters.workspaceId);
  return {} ; // the result is injected by the handler because workspaceId exists in the path
});


// populates path up to 3 levels
export const getWorkspaceById = async (tenant, workspaceId, level = 3) => {
  let workspace = await getSingleWorkspace(tenant, workspaceId);

  if (!workspace) {
    throw new Error("Item not found.");
  }

  if (level > 1 && workspace.parentId) {
    workspace.parent = await getWorkspaceById(tenant, workspace.parentId, level - 1);
  }

  return workspace;
};



const  getSingleWorkspace = async (tenant, workspaceId) => {
  const params = {
    TableName: process.env.WORKSPACE_TABLE,
    Key: {
      tenant: tenant, 
      workspaceId: workspaceId, 
    },
  };

  const result = await dynamoDb.get(params);
  return result.Item;
}