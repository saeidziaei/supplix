import { Amplify, API, Auth } from 'aws-amplify';
import axios from "axios";


export async function uploadFile (presignedUrl, filePath)  {
  try {
    const reader = new FileReader();
    const file = await reader.readAsArrayBuffer(filePath);
    console.log(file, filePath);
    const result = await axios.put(presignedUrl, file);
    console.info(result.data);
    return result.data;
  }
  catch (error) {
    console.error(error.response.data, { request: error.request })
  }

};




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
