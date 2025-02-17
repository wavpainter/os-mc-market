const config = require("./config");
const {Storage} = require('@google-cloud/storage');
const { get_file_timestamp } = require("./util");

const storage = new Storage();
async function getFiles() {
    const [files] = await storage.bucket(config.bucketName).getFiles();

    const fileData = files.map(file => {
        return {
            id: file.id,
            name: file.name,
            datetime: get_file_timestamp(file.name)
        }
    });

    return fileData;
}

async function getFile(id) {
    const contents = await storage.bucket(config.bucketName).file(id).download();

    return JSON.parse(contents.toString());
}

module.exports = { getFiles, getFile }