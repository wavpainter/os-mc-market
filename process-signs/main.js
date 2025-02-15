"use strict";

import {process_sign_scrape} from "./process-signs.js";
import {read_config} from "./config.js";

const config = await read_config();
const scrapePath = config["scrapePath"];

const orders = await process_sign_scrape(scrapePath);

console.log(orders.length);