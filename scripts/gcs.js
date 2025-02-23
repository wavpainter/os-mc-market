import config from "./config.js";
import { Storage } from "@google-cloud/storage";

process.env["GOOGLE_APPLICATION_CREDENTIALS"] = config.gcsCredentialsPath;

const bucketName = config.gcsBucketName;
const storage = new Storage();

async function upload(fileName,contents) {
    await storage.bucket(bucketName).file(fileName).save(contents);

    console.log("Finished upload");
}

async function updateCacheControl(fileName) {

    const [metadata] = await storage
    .bucket(bucketName)
    .file(fileName)
    .setMetadata(
      {
        // Predefined metadata for server e.g. 'cacheControl', 'contentDisposition',
        // 'contentEncoding', 'contentLanguage', 'contentType'
        cacheControl: 'public, max-age=300'
      }
    );

    console.log(
        'Updated metadata for object',
        fileName
    );
    console.log(metadata);
}

export {upload,updateCacheControl};