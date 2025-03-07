
async function getCronDeltas(deltas,shopLookup) {
    // Compare to previous stock and generate deltas
    let logs = [];
    for(let i = 0; i < deltas.length; i++) {
        let delta = deltas[i];
        let shopId = delta.shop_id;
        let shop = shopLookup[shopId];

        if(delta.quantity == 0 || shop == undefined) continue;

        if(delta.prev_shop_id == null) {
            let unitPrice = delta.price / delta.quantity;

            logs.push({
                shop,
                at: delta.timestamp,
                type: "New",
                unitPrice
            })
        } else {
            if(shop["orderType"] == "Sell") {

                if(delta.stock > delta.prev_stock) {
                    logs.push({
                        shop,
                        at: delta.timestamp,
                        type: "Restocked",
                    })
                } else if(delta.prev_stock > 0 && delta.stock == 0) {
                    logs.push({
                        shop,
                        at: delta.timestamp,
                        type: "Out of Stock"
                    })
                }
            }

            if(delta.prev_quantity != 0) {
                let prevUnitPrice = delta.prev_price / delta.prev_quantity;
                let unitPrice = delta.price / delta.quantity;

                if(prevUnitPrice < unitPrice) {
                    logs.push({
                        shop,
                        at: delta.timestamp,
                        type: "New Price",
                        prevUnitPrice,
                        unitPrice
                    })
                }else if(unitPrice < prevUnitPrice) {
                    logs.push({
                        shop,
                        at: delta.timestamp,
                        type: "New Price",
                        prevUnitPrice,
                        unitPrice
                    })
                }
            }
        }
    }

    return logs;
}

export default {getCronDeltas};