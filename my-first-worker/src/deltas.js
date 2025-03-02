
async function getCronDeltas(db,cron,prevCron,shopLookup,oldShopId) {
    if(cron == null || prevCron == null) return [];

    let qres;

    // Get shop stocks
    let getShopStockStatement = db.prepare(
        "SELECT * FROM shop_stock WHERE datetime(cron_timestamp) = datetime(?)"
    );

    // Currrent stock
    qres = await getShopStockStatement
    .bind(cron)
    .all();

    let shopStocks = [];
    if(qres.results.length == 0) return [];
    shopStocks = qres.results;

    // Compare to previous stock and generate deltas
    let deltas = [];
    for(let i = 0; i < shopStocks.length; i++) {
        let shopStock = shopStocks[i];
        let shopId = shopStock.shop_id;
        let shop = shopLookup[shopId];

        if(shop == undefined) continue;

        qres = await db.prepare(
            "SELECT * FROM shop_stock WHERE shop_id = ? AND datetime(cron_timestamp) <= datetime(?) ORDER BY datetime(cron_timestamp) DESC LIMIT 1"
        )
        .bind(shopId,prevCron)
        .all();

        let prevShopStocks = qres.results;

        if(prevShopStocks.length == 0) {
            let unitPrice = shopStock.price / shopStock.quantity;

            deltas.push({
                shop,
                at: cron,
                type: "New",
                unitPrice
            })
        } else {
            let prevShopStock = prevShopStocks[0];

            if(shop["orderType"] == "Sell") {

                if(prevShopStock.stock == 0 && shopStock.stock > 0) {
                    deltas.push({
                        shop,
                        at: cron,
                        type: "Restocked",
                    })
                } else if(prevShopStock.stock > 0 && shopStock.stock == 0) {
                    deltas.push({
                        shop,
                        at: cron,
                        type: "Out of Stock"
                    })
                }
            }

            if(prevShopStock.quantity != 0) {
                let prevUnitPrice = prevShopStock.price / prevShopStock.quantity;
                let unitPrice = shopStock.price / shopStock.quantity;

                if(prevUnitPrice < unitPrice) {
                    deltas.push({
                        shop,
                        at: cron,
                        type: "New Price",
                        prevUnitPrice,
                        unitPrice
                    })
                }else if(unitPrice < prevUnitPrice) {
                    deltas.push({
                        shop,
                        at: cron,
                        type: "New Price",
                        prevUnitPrice,
                        unitPrice
                    })
                }
            }
        }
    }

    return deltas;
}

async function getCronDeltasFrom(db,t0,shopLookup,oldShopId) {
    let qres;

    // Get all recent stock
    qres = await db.prepare(
        "SELECT * FROM shop_stock WHERE datetime(timestamp) > datetime(?)"
    )
    .bind(t0)
    .all();

    let deltas = []

    for(let i = 0; i < qres.results.length; i++) {
        let cron = qres.results[i];
        let cronDeltas = await getCronDeltas(db,cron.timestamp,cron.previous_cron_timestamp,shopLookup,oldShopId);
        deltas.push(...cronDeltas);
    }

    return deltas;
}

export default {getCronDeltas,getCronDeltasFrom};