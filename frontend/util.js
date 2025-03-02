function fetchJSON(url) {
    return new Promise((resolve,reject) => {
        fetch(url).then(response => {
            if(!response.ok) {
                reject("Fetching " + url + " resulted in " + response.status);
            }
            return response.json();
        }).then(data => {
            resolve(data);
        }).catch(error => {
            console.error(error);
            reject("Failed to load " + url);
        })
    })
}

function ele(id) {
    return document.getElementById(id);
}

function getOrderKey(order) {
    return order['player_name'] + ':' + order['item'] + ':' + order['order_type'] + ':' + order['x'] + ':' + order['y'] + ':' + order['z'];
}

function adjustPrice(price,useOSMDollars,diamondMedian) {
    if(useOSMDollars || price == 0 || diamondMedian == null) return "$" + price.toFixed(2);
    else return (diamondMedian / price).toFixed(1);
}

let orderViewMap = {
    'Sell': 'selling',
    'Buy': 'buying'
}

let viewOrderMap = {
    "buying": "Buy",
    "selling": "Sell"
}

function generateLogText(log,itemName,items) {
    let item = items[itemName];
    let playerName = log.shop.playerName;
    let orderType = log.shop.orderType;
    let commonItemName = item == undefined ? "undef" : item.name;

    switch(log['type']) {
        case "Restocked":
            return `${playerName}'s ${commonItemName} shop is back in stock.`;

        case "Out of Stock":
            return `${playerName}'s ${commonItemName} shop is out of stock.`;

        case "New Price":
            let prevUnitPrice = log.prevUnitPrice;
            let unitPrice = log.unitPrice;

            if(unitPrice == 0) return `${log.shop.playerName}'s ${commonItemName} shop is now free!`;
            else if(prevUnitPrice == 0) return `${log.shop.playerName}'s ${commonItemName} shop is no longer free.`

            let percentChange = Math.round(100 *(unitPrice - prevUnitPrice) / prevUnitPrice);
            let dir = percentChange < 0 ? 'less' : 'more';
            let positivePercentChange = Math.abs(percentChange);

            return `${playerName} is ${orderViewMap[orderType]} ${commonItemName} for ${positivePercentChange} ${dir}.`;
        
        case "New":
            return `${log.shop.playerName}'s shop is ${orderViewMap[orderType]} ${commonItemName}.`;
    }
}