"use strict";

import fs from 'fs';
import csv from 'csv-parser';

function read_sign_data(csv_path) {
    return new Promise((resolve,reject) => {
        let all_sign_data = [];

        fs.createReadStream(csv_path)
        .pipe(csv())
        .on('data', function (sign_data) {
            try {
                all_sign_data.push(sign_data);
            } catch(err) {
                console.log("Error parsing line");
            }
        })
        .on('end', function() {
            resolve(all_sign_data);
        });
    });
}

const quantity_re = new RegExp("^([0-9]+)$")
const order_re = new RegExp("^([BS]) *([0-9]+.?[0-9]*)$")
const order_type_lookup = {
    'B': 'Sell',
    'S': 'Buy'
}
function get_order_data(sign_data) {
    // Player name
    let player_name = sign_data['line1'];
    if(player_name == '') return null;

    // Quantity
    let quantity_matches = sign_data['line2'].match(quantity_re);
    if(quantity_matches == null) return null;
    let quantity = parseInt(sign_data['line2']);

    // Order (Buy/Sell and price)
    let order_matches = sign_data['line3'].match(order_re);
    if(order_matches == null || order_matches.length != 3) return null;
    let order_type = order_type_lookup[order_matches[1]];
    let price = parseFloat(order_matches[2]);
    
    // Item
    let item = sign_data['line4'];

    // Coordinates
    let x = parseInt(sign_data['x']);
    let y = parseInt(sign_data['y']);
    let z = parseInt(sign_data['z']);

    return {
        x,
        y,
        z,
        player_name,
        quantity,
        order_type,
        price,
        item
    }
}

async function process_sign_scrape(csv_path) {
    let data = await read_sign_data(csv_path);
    let orders = [];

    data.forEach(sign_data => {
        let order_data = get_order_data(sign_data);

        if(order_data != null) {
            orders.push(order_data);
        }
    })

    return orders;
}



export {process_sign_scrape};