import { Amplify } from "aws-amplify";
import config from "../../config";
import { Auth } from "aws-amplify";
import { makeApiCall } from "../../lib/apiLib";

jest.setTimeout(10000)

beforeAll(() => {
  Amplify.configure({
    Auth: {
      mandatorySignIn: true,
      region: config.cognito.REGION,
      userPoolId: config.cognito.USER_POOL_ID,
      identityPoolId: config.cognito.IDENTITY_POOL_ID,
      userPoolWebClientId: config.cognito.APP_CLIENT_ID,
    },
    Storage: {
      region: config.s3.REGION,
      bucket: config.s3.BUCKET,
      identityPoolId: config.cognito.IDENTITY_POOL_ID,
    },
    API: {
      endpoints: [
        {
          name: "iso-cloud",
          endpoint: config.apiGateway.URL,
          region: config.apiGateway.REGION,
        },
      ],
    },
  });
});

describe("top level admin", () => {
  let createdTenant;

  beforeAll(async () => {
    const ret = await Auth.signIn(process.env.TOP_LEVEL_EMAIL, process.env.TOP_LEVEL_PASSWORD);
  });
  afterAll(async () => {
    if (createdTenant) {
      await makeApiCall("DELETE", `/tenants/${createdTenant.tenantId}`);
      console.log("deleted test tenant ", createdTenant.tenantId);
    }
    Auth.signOut();
  });

  it("Top level admin should be able to add tenants", async () => {
    const item = {
      tenantName: "test tenant",
      contactPerson: "cp",
      contactNumber: "cn",
      contactEmail: "test@test.com",
      website: "w",
      note: "n",
      logo: "logo.png",
    };
    createdTenant = await makeApiCall("POST", "/tenants", item);
    const tenants = await makeApiCall("GET", `/tenants`);

    expect(tenants).toEqual(expect.arrayContaining([createdTenant]));
  });
});

describe("admin", () => {
  beforeAll(async () => {
    const ret = await Auth.signIn(process.env.ADMIN_TENANT1_EMAIL, process.env.ADMIN_TENANT1_PASSWORD);
  });

  afterAll(async () => {
    async function deleteWorkspace(workspaceId) {
      await makeApiCall("DELETE", `/workspaces/${workspaceId}`);
    }

    Auth.signOut();
    const ret = await Auth.signIn(process.env.ADMIN_TENANT1_EMAIL, process.env.ADMIN_TENANT1_PASSWORD);

    if (workspace_one) {
      await deleteWorkspace(workspace_one.workspaceId);
      await deleteWorkspaceMember(workspace_one.workspaceId, process.env.PM11_TENANT1_USERID);
    }

    if (workspace_two) {
      await deleteWorkspace(workspace_two.workspaceId);
      await deleteWorkspaceMember(workspace_two.workspaceId, process.env.PM21_TENANT1_USERID);
    }

    console.log("deleted workspaces and PMs");

  });

  it("10. Admin should NOT be able to add tenants", async () => {
    const item = {
      tenantName: "test tenant",
      contactPerson: "cp",
      contactNumber: "cn",
      contactEmail: "test@test.com",
      website: "w",
      note: "n",
      logo: "logo.png",
    };
    try {
      await makeApiCall("POST", "/tenants", item);
      // The test should fail if makeApiCall does not throw an error.
      throw new Error("Expected makeApiCall to throw an error.");
    } catch (error) {
      expect(error.message).toEqual("Request failed with status code 403");
    }
  });

  let workspace_one, workspace_two;
  describe("Create Workspace", () => {
    it("30. Admin should be able to add workspaces", async () => {
      workspace_one = await createWorkspace("workspace_one");
      workspace_two = await createWorkspace("workspace_two");
    });
  });

  describe("Assign Owners", () => {
    it("50. Admin should be able to add workspace owner", async () => {
      await createWorkspaceMember(workspace_one.workspaceId, process.env.PM11_TENANT1_USERID, "Owner");
      await createWorkspaceMember(workspace_two.workspaceId, process.env.PM21_TENANT1_USERID, "Owner");

    });
  });



  describe("pm", () => {
    beforeAll(async () => {
      const ret = await Auth.signIn(process.env.PM11_TENANT1_EMAIL, process.env.PM11_TENANT1_PASSWORD);
    });
    
    it("60. Workspace owner should be able to add workspace member", async () => {
      // adding members to workspace_one. PM11 is not the owner of workspace_two
      console.log("adding user 11 to workspace one")
      await createWorkspaceMember(workspace_one.workspaceId, process.env.USER11_TENANT1_USERID, "Member");
      await deleteWorkspaceMember(workspace_one.workspaceId, process.env.USER11_TENANT1_USERID);
    });

    it("90. Workspace owner should NOT be able to add member to someone else's workspace", async () => {
      // adding members to workspace_one. PM11 is not the owner of workspace_two
      console.log("trying to add user 11 to workspace two")
      
      try {
        await createWorkspaceMember(workspace_two.workspaceId, process.env.USER12_TENANT1_USERID, "Member");
        // The test should fail if makeApiCall does not throw an error.
        throw new Error("Expected makeApiCall to throw an error.");
      } catch (error) {
        expect(error.message).toEqual("Request failed with status code 403");
      }
    });

  });
});



  async function createWorkspaceMember(workspaceId, userId, role) {
    const item = {
      userId,
      role
    };
    const member = await makeApiCall("POST", `/workspaces/${workspaceId}/members`, item);

 
    const members = await makeApiCall("GET", `/workspaces/${workspaceId}/members`);

    expect(members).toEqual(expect.arrayContaining([member]));
  }
  async function createWorkspace(name) {
    const item = {
      workspaceName: name,
      category: "Unit Test",
      note: "Workspace added just for unit testing purposes",
    };
    const workspace = await makeApiCall("POST", "/workspaces", item);
    const workspaces = await makeApiCall("GET", `/workspaces`);

    expect(workspaces).toEqual(expect.arrayContaining([workspace]));
    return workspace;
  }
  async function deleteWorkspaceMember(workspaceId, userId) {
    await makeApiCall("DELETE", `/workspaces/${workspaceId}/members/${userId}`);
  }

