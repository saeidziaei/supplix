import { Amplify, API, Auth } from 'aws-amplify';



// export function JwtApi(jwt) {
//   console.log("JwtApi");
//   //  const apiName = "iso-cloud"; // TODO get from config
//   const apiName = Amplify.configure().API.endpoints[0].name;

//   const headers = {
//     Authorization: `Bearer ${jwt}`,
//   };

//   return (method, route, body) => {
//     switch (method) {
//       case "POST":
//         return API.post(apiName, route, {
//           headers: headers,
//           body: body,
//         });
//       case "PUT":
//         return API.put(apiName, route, {
//           headers: headers,
//           body: body,
//         });
//       case "GET":
//         return API.get(apiName, route, {
//           headers: headers,
//         });

//       default:
//         return null;
//     }
//   };
// }


export async function makeApiCall(method, endpoint, body) {
  // Get the current user session
  const session = await Auth.currentSession();
  // Get the JWT token from the session
  const jwtToken = session.getIdToken().getJwtToken();
  // Define the headers for the API call
  const headers = {
    Authorization: `Bearer ${jwtToken}`,
  };
  const apiName = Amplify.configure().API.endpoints[0].name;

  switch (method) {
    case "GET":
      return API.get(apiName, endpoint, {
        headers: headers
      });
    case "POST":
      return API.post(apiName, endpoint, {
        headers: headers,
        body: body
      });
    case "PUT":
      return API.put(apiName, endpoint, {
        headers: headers,
        body: body
      });
    default:
      return null;
  }
}
