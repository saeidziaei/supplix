import { Amplify } from "aws-amplify";
import config from "../../config";
import { Auth } from "aws-amplify";
import { makeApiCall } from "../../lib/apiLib";

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
    const ret = await Auth.signIn(process.env.T_EMAIL, process.env.T_PASSWORD);
  });
  afterAll(async () => {
    if (createdTenant) {
      await makeApiCall("DELETE", `/tenants/${createdTenant.tenantId}`);
      console.log("deleted test tenant ", createdTenant.tenantId);
    }
  });

  it("should be able to add tenants", async () => {
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
    const ret = await Auth.signIn(process.env.A_EMAIL, process.env.A_PASSWORD);
  });

  it("should not be able to add tenants", async () => {
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
});
