const config = require("./config");
const {Storage} = require('@google-cloud/storage');

const storage = new Storage();
async function getFiles() {
    const [files] = await storage.bucket(config.bucketName).getFiles();

    const fileData = files.map(file => {
        console.log(file);

        return {
            id: file.id,
            name: file.name
        }

    });

    return fileData;
}

module.exports = { getFiles }