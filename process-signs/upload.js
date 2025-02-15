import config from "./config.js";
import { Storage } from "@google-cloud/storage";

process.env["GOOGLE_APPLICATION_CREDENTIALS"] = config.gcsCredentialsPath;

const bucketName = config.gcsBucketName;
const storage = new Storage();

async function upload(fileName,contents) {
    await storage.bucket(bucketName).file(fileName).save(contents);

    console.log("Finished upload");
}

export {upload};