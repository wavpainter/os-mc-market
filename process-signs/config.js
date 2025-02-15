"use strict";

import fs from "node:fs/promises";

async function read_config() {
    let filehandle;
    try {
        filehandle = await fs.open('config.json','r');
        let config = await filehandle.readFile({ encoding: 'utf8' });
        return JSON.parse(config);
    } finally {
        if (filehandle) await filehandle.close();     
    }
}

export {read_config};