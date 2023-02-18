// import * as debug from "./debug";
import { CognitoIdentityServiceProvider } from 'aws-sdk';



export default function handler(lambda, requiredGroup) {
  return async function (event, context) {
    let body, statusCode;
    const tenant = getTenantFromRequest(event);
    // Start debugger
    // debug.init(event);

    try {
      
      if (requiredGroup && !userInGroup(event, requiredGroup)) {
        body = {error: 'Unauthorised'};
        statusCode = 403;
      } else {
        // Run the Lambda
        
        body = await lambda(event, tenant, context);
        statusCode = 200;
      }
    } catch (e) {
      // Print debug messages
      //   debug.flush(e);

      body = { error: e.message };
      statusCode = 500;
      // TODO Log to Cloudwatch
      // {tenantId, e.message .... other info}
    }

    // Return HTTP response
    return {
      statusCode,
      body: JSON.stringify(body),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
    };
  };
}


function userInGroup(event, requiredGroup) {
  const claims = event.requestContext.authorizer.jwt.claims;
  return (claims['cognito:groups'] && claims['cognito:groups'].includes(requiredGroup))
}

function getTenantFromRequest(event) {
  const claims = event.requestContext.authorizer.jwt.claims;
  return claims['custom:tenant'];
}