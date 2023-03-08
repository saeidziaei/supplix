import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const client = DynamoDBDocument.from(new DynamoDB());

export default {
  get: (params) => client.get(params),
  put: (params) => client.put(params),
  query: (params) => client.query(params),
  update: (params) => client.update(params),
  delete: (params) => client.delete(params),
  scan: (params) => client.scan(params),
};

// import AWS from "aws-sdk";

// const client = new AWS.DynamoDB.DocumentClient();

// export default {
//   get: (params) => client.get(params).promise(),
//   put: (params) => client.put(params).promise(),
//   query: (params) => client.query(params).promise(),
//   update: (params) => client.update(params).promise(),
//   delete: (params) => client.delete(params).promise(),
//   scan: (params) => client.scan(params).promise(),
// };