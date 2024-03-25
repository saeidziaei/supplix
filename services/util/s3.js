import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";

const s3 = new S3();

export default {
  getObject: (params) => s3.getObject(params),
  putObject: (params) => s3.putObject(params),
  deleteObject: (params) => s3.deleteObject(params),
  getSignedUrlForPut: (params) => {
    const putObjectParams = {Bucket: params.Bucket, Key: params.Key, ContentType: params.ContentType};
    return getSignedUrl(s3, new PutObjectCommand(putObjectParams), {expiresIn: params.Expires});
},
  getSignedUrlForGet: (params) => { 
    const getObjectParams = {Bucket: params.Bucket, Key: params.Key, ContentType: params.ContentType};
    return getSignedUrl(s3, new GetObjectCommand(getObjectParams), { expiresIn: params.Expires });
},
};


