import AWS from "aws-sdk";

const s3 = new AWS.S3();

export default {
  getObject: (params) => s3.getObject(params).promise(),
  putObject: (params) => s3.putObject(params).promise(),
  deleteObject: (params) => s3.deleteObject(params).promise(),
  getSignedUrlForPut: (params) => s3.getSignedUrlPromise("putObject", params),
  getSignedUrlForGet: (params) => s3.getSignedUrlPromise("getObject", params),
};


/*
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client();

async function getSignedURL(command, params) {
  const commandOptions = {
    Bucket: params.Bucket, 
    Key: params.Key,
  };
  const commandObject = command === "get" ? new GetObjectCommand(commandOptions) : new PutObjectCommand(commandOptions);
  
  return await getSignedUrl(client, commandObject, { expiresIn: params.Expires });
}

export default {
  getObject: (params) => client.getObject(params),
  putObject: (params) => client.putObject(params),
  deleteObject: (params) => client.deleteObject(params),
  getSignedUrlForGet: (params) => getSignedURL("get", params),
  getSignedUrlForGet: (params) => getSignedURL("put", params),
};

*/