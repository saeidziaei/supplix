import { Amplify, API } from 'aws-amplify';

import { useAppContext } from "./contextLib";

export function JwtApi() {
  const { jwtToken } = useAppContext();

  //  const apiName = "iso-cloud"; // TODO get from config
  const apiName = Amplify.configure().API.endpoints[0].name;

  const headers = {
    Authorization: `Bearer ${jwtToken}`,
  };

  return (method, route, body) => {
    switch (method) {
      case "POST":
        return API.post(apiName, route, {
          headers: headers,
          body: body,
        });
      case "PUT":
        return API.put(apiName, route, {
          headers: headers,
          body: body,
        });
      case "GET":
        return API.get(apiName, route, {
          headers: headers,
        });

      default:
        return null;
    }
  };
}
