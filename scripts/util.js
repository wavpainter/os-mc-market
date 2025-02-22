"use strict";

import fs from "node:fs/promises";
import path from "path";

async function read_file(fp) {
    let filehandle;
    try {
        filehandle = await fs.open(fp,'r');
        let contents = await filehandle.readFile({ encoding: 'utf8' });
        return contents;
    } finally {
        if (filehandle) await filehandle.close();     
    }
}

async function read_json(fp) {
    let filehandle;
    try {
        filehandle = await fs.open(fp,'r');
        let contents = await filehandle.readFile({ encoding: 'utf8' });
        return JSON.parse(contents);
    } finally {
        if (filehandle) await filehandle.close();     
    }
}

async function write_json(fp,data) {
    let contents = JSON.stringify(data);
    let filehandle;
    try {
        filehandle = await fs.open(fp,'w');
        await filehandle.writeFile(contents,{encoding: 'utf-8'});
    }finally {
        if(filehandle) await filehandle.close();
    }
}

let timestamp_re = new RegExp("^.*_([0-9\-]+T[0-9]+_[0-9]+_[0-9]+.[0-9]+Z)\.[a-z]+$");
function get_file_timestamp(filename) {
    let timestamp_match = filename.match(timestamp_re);
    if(timestamp_match == null || timestamp_match.length != 2) return null;
    let timestamp = timestamp_match[1].replaceAll('_',':');

    return timestamp;
}

async function get_latest_suffix(dir) {
    let fileNames = await fs.readdir(dir);

    let dts = []

    fileNames.forEach(fileName => {
      dts.push(get_file_timestamp(fileName));
    })

    let sorted_dts = dts.sort((a,b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    })

    let latest_dt = sorted_dts[0];
    let filenameSuffix = "_" + latest_dt.replaceAll(':','_') + ".json";

    return filenameSuffix;
}

export {get_file_timestamp,read_json,write_json,get_latest_suffix, read_file};
