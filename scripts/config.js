"use strict";

import {read_json} from "./util.js";

const config = await read_json("config.json");
const config_data = {
    scrapePath: config["scrapePath"],
    locationsPath: config["locationsPath"],
    itemsPath: config["itemsPath"],
    gcsCredentialsPath: config["gcsCredentialsPath"],
    gcsBucketName: config["gcsBucketName"],
    localOutputPath: config["localOutputPath"]
}

export default config_data;