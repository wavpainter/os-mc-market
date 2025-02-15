"use strict";

import {process_sign_scrape,find_location,aggregate} from "./process-signs.js";
import config from "./config.js";
import { read_json, write_json, get_scrape_timestamp } from "./util.js";

const timestamp = await get_scrape_timestamp(config.scrapePath);
const scrapePath = config.scrapePath;
const locationsPath = config.locationsPath;
const locations = await read_json(locationsPath);
const orders = await process_sign_scrape(scrapePath);
orders.forEach(order => {
    order['location'] = find_location(order.x,order.y,order.z,locations);
})
const filterCond = order => true;
const aggregated = aggregate(orders);

const document = {
    scrapedAt: timestamp,
    orders,
    aggregated
}

write_json("document_"+timestamp.replace(':','.')+".json",document);
