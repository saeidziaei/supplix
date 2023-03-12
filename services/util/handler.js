export default function handler(lambda) {
  return async function (event, context) {
    let body, statusCode;
    const tenant = getTenantFromRequest(event);
    // Start debugger
    // debug.init(event);

    try {
      const allowedGroups = process.env.ALLOWED_GROUPS ? process.env.ALLOWED_GROUPS.split(",") : [];
      const userGroups = event.requestContext.authorizer.jwt.claims['cognito:groups'] || [];

      if (allowedGroups.length === 0 || allowedGroups.some(group => userGroups.includes(group))) {
        body = await lambda(event, tenant, context);
        statusCode = 200;
      } else {
        body = {error: 'Unauthorised'};
        statusCode = 403;
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



function getTenantFromRequest(event) {
  const claims = event.requestContext.authorizer.jwt.claims;
  return claims['custom:tenant'];
}



