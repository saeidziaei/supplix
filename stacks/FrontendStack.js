import { StaticSite, use } from "sst/constructs";

import { AuthAndApiStack } from "./AuthAndApiStack";
import { StorageStack } from "./StorageStack";

export function FrontendStack({ stack, app }) {
  const { api, auth } = use(AuthAndApiStack);
  const { bucket } = use(StorageStack);


  // Define our React app
  
  const site = new StaticSite(stack, "Site", {
    customDomain:
      app.stage === "prod"
        ? {
            domainName: `${process.env.DOMAIN}`,
            domainAlias: `www.${process.env.DOMAIN}`,
          }
        // : 
        // app.stage === "stg"
        // ? {
        //   domainName: `stg.${process.env.DOMAIN}`,
        // }
        : 
        undefined,


    path: "iso-forms-ynex",     
    buildCommand: "npm run build", // or "yarn build"
    buildOutput: "dist", 

    
    // Pass in our environment variables
    environment: {
      VITE_APP_API_URL: api.customDomainUrl || api.url,
      VITE_APP_REGION: app.region,
      VITE_APP_BUCKET: bucket.bucketName,
      VITE_APP_USER_POOL_ID: auth.userPoolId,
      VITE_APP_IDENTITY_POOL_ID: auth.cognitoIdentityPoolId,
      VITE_APP_USER_POOL_CLIENT_ID: auth.userPoolClientId,
      


    },
  });
  // Show the url in the output
  stack.addOutputs({
    SiteUrl: site.customDomainUrl || site.url || "http://localhost:3000",
    Bucket: bucket.bucketName
  });
}
