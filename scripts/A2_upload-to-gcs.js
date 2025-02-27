import config from "./config.js";
import { upload,updateCacheControl } from "./gcs.js";
import path from "path";
import {get_latest_suffix,read_file} from "./util.js"

let latestSuffix = await get_latest_suffix(config.localOutputPath);
let latestMarketData = await read_file(path.join(config.localOutputPath,"market_data" + latestSuffix));


console.log("Uploading market_data.json");
await upload("market_data.json",latestMarketData);
await updateCacheControl("market_data.json");

let latestLocations = await read_file(config.locationsPath);

console.log("Uploading locations.json");
await upload("locations.json",latestLocations);
await updateCacheControl("locations.json");

let latestItems = await read_file(config.itemsPath);

console.log("Uploading items.json");
await upload("items.json",latestItems);
await updateCacheControl("items.json");