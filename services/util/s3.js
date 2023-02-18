import AWS from "aws-sdk";

const s3 = new AWS.S3();

export default {
  getObject: (params) => s3.getObject(params).promise(),
  putObject: (params) => s3.putObject(params).promise(),
  deleteObject: (params) => s3.deleteObject(params).promise(),
  getSignedUrlForPut: (params) => s3.getSignedUrlPromise("putObject", params),
  getSignedUrlForGet: (params) => s3.getSignedUrlPromise("getObject", params),
};
