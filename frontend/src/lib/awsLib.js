import { Storage } from "aws-amplify";
import config from "../config";

export async function s3Upload(file) {
  const filename = `${Date.now()}-${file.name}`;
  
  const bucketName = config.s3.BUCKET;
  console.log("loading into", bucketName);
  const stored = await Storage.put(filename, file, {
    contentType: file.type,
    bucket: bucketName
  });

  return stored.key;
}