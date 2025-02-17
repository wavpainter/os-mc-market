let fs = require("node:fs/promises");

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

let timestamp_re = new RegExp("^[^_]*_([0-9\-]+T[0-9]+_[0-9]+_[0-9]+.[0-9]+Z)\.json$");
function get_file_timestamp(filename) {
    let timestamp_match = filename.match(timestamp_re);
    if(timestamp_match == null || timestamp_match.length != 2) return null;
    let timestamp = timestamp_match[1].replaceAll('_',':');

    return timestamp;
}

module.exports = {get_file_timestamp,read_json,write_json};