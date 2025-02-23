import {read_json,write_json} from "./util.js"
import path from 'path'

let items = await read_json(path.join(import.meta.dirname,'..','items.json'));
await write_json(path.join(import.meta.dirname,'..','frontend','items','items.json'),items)

console.log("Finished copying items to frontend folder");