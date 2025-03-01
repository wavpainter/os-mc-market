
async function getCronDeltas(db,cron,prevCron) {
    if(cron == null || prevCron == null) return [];

    let qres;

    // Get shops
    qres = await db.prepare(
        "SELECT * FROM shop"
    )
    .all();

    let shopLookup = {};
    if(qres.results.length == 0) return [];
    qres.results.forEach(shop => {
        shopLookup[shop.id] = {
            playerName: shop.player,
            x: shop.x,
            y: shop.x,
            z: shop.z,
            orderType: shop.order_type,
            itemId: shop.item_id
        }
    });

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

    qres = await getShopStockStatement
    .bind(prevCron)
    .all();

    let prevShopStockLookup = {};
    if(qres.results.length == 0)  return [];
    qres.results.forEach(shop_stock => {
        prevShopStockLookup[shop_stock.shop_id] = shop_stock;
    })

    // Compare to previous stock and generate deltas
    let deltas = [];
    shopStocks.forEach(shopStock => {
        let shopId = shopStock.shop_id;
        let prevShopStock = prevShopStockLookup[shopId];
        let shop = shopLookup[shopId];

        if(prevShopStock == undefined) {
            deltas.push({
                shop,
                at: cron,
                type: "New"
            })
        } else {
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

            if(prevShopStock.quantity != 0 && shopStock.quantity != 0) {
                let prevUnitPrice = prevShopStock.price / prevShopStock.quantity;
                let unitPrice = shopStock.price / shopStock.quantity;

                if(prevUnitPrice < unitPrice) {
                    deltas.push({
                        shop,
                        at: cron,
                        type: "Price Increased",
                        prevUnitPrice,
                        unitPrice
                    })
                }else if(unitPrice < prevUnitPrice) {
                    deltas.push({
                        shop,
                        at: cron,
                        type: "Price Lowered",
                        prevUnitPrice,
                        unitPrice
                    })
                }
            }
        }
    })

    return deltas;
}

async function getCronDeltasFrom(db,t0) {
    let qres;

    // Get crons
    qres = await db.prepare(
        "SELECT * FROM cron WHERE datetime(timestamp) > datetime(?)"
    )
    .bind(t0)
    .all();

    let deltas = []

    for(let i = 0; i < qres.results.length; i++) {
        let cron = qres.results[i];
        let cronDeltas = await getCronDeltas(db,cron.timestamp,cron.previous_cron_timestamp);
        deltas.push(...cronDeltas);
    }

    return deltas;
}

export default {getCronDeltas,getCronDeltasFrom};