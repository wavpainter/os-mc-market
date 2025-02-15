"use strict";

// Imports
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

// Get order data from sign text
const quantity_re = new RegExp("^([0-9]+)$")
const order_re = new RegExp("^([BS]) *([0-9]+.?[0-9]*)$")
const order_type_lookup = {
    'B': 'Sell',
    'S': 'Buy'
}
function get_order_data(sign_data) {
    // Player name
    let player_name = sign_data['line1'].trim();
    if(player_name == '') return null;

    // Quantity
    let quantity_matches = sign_data['line2'].trim().match(quantity_re);
    if(quantity_matches == null) return null;
    let quantity = parseInt(sign_data['line2']);

    // Order (Buy/Sell and price)
    let order_matches = sign_data['line3'].trim().match(order_re);
    if(order_matches == null || order_matches.length != 3) return null;
    let order_type = order_type_lookup[order_matches[1]];
    let price = parseFloat(order_matches[2]);
    
    // Item
    let item = sign_data['line4'].trim().toUpperCase();

    // Coordinates
    let x = parseInt(sign_data['x']);
    let y = parseInt(sign_data['y']);
    let z = parseInt(sign_data['z']);

    // Construct object
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

// Process CSV containing sign text
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

// Get the location the item is being sold e.g. ['Mall',"Foo's Store"]
function find_location(x,y,z,locations) {
    let location_arr = [];
    for (const location_name in locations) {
        let location = locations[location_name];
        let in_bounds = false;
        for(const bound_name in location["bounds"]) {
            let bound = location["bounds"][bound_name];
            let lower = bound[0];
            let upper = bound[1];
            if(x >= lower[0] && x <= upper[0] &&
                y >= lower[1] && y <= upper[1] &&
                z >= lower[2] && z <= upper[2]
            ) {
                in_bounds = true;
                break;
            }
        }
        if(in_bounds) {
            location_arr.push(location_name);
            let sublocations = location["sublocations"];
            if(sublocations != undefined) {
                let sublocation_arr = find_location(x,y,z,sublocations);
                location_arr.push(...sublocation_arr);
            }
        }
    }
    return location_arr;
}

// Aggregate prices
function aggregate(orders,filter = (order) => true) {
    let aggregated = {}
    let itemPrices = {}
    orders.forEach(order => {
        if(!filter(order)) return;

        if(!(order.item in itemPrices)) {
            itemPrices[order.item] = {
                "Buy": [],
                "Sell": []
            }
        }
        itemPrices[order.item][order.order_type].push(order.price / order.quantity);
    });

    Object.keys(itemPrices).forEach(itemName => {

        let buyPrices = itemPrices[itemName]["Buy"];
        let sellPrices = itemPrices[itemName]["Sell"];

        buyPrices.sort();
        sellPrices.sort();

        let meanBuy = buyPrices.reduce((accum,val) => accum + val,0) / buyPrices.length;
        let meanSell = sellPrices.reduce((accum,val) => accum + val,0) / sellPrices.length;

        aggregated[itemName] = {
            "Buy": {
                count: buyPrices.length,
                mean: meanBuy,
                median: buyPrices[Math.floor(buyPrices.length / 2)],
                high: buyPrices[buyPrices.length - 1],
                low: buyPrices[0]
            },
            "Sell": {
                count: sellPrices.length,
                mean: meanSell,
                median: sellPrices[Math.floor(sellPrices.length/2)],
                high: sellPrices[sellPrices.length - 1],
                low: sellPrices[0]
            }
        }
    })

    return aggregated
}

export {process_sign_scrape, find_location, aggregate};