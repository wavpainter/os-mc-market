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
    if(useOSMDollars || price == 0 || diamondMedian == null) {
        let suffix = "";
        if(price > 1e12) {
            suffix = "T"
            price = price / 1e12;
        }
        else if(price > 1e9) {
            suffix = "B"
            price = price / 1e9;
        } else if (price > 1e6) {
            suffix = "M"
            price = price / 1e6;
        } else if (price > 1e3) {
            suffix = "K"
            price = price / 1e3
        }

        return "$" + price.toFixed(2) + suffix;
    } else return (diamondMedian / price).toFixed(1);
}

let orderViewMap = {
    'Sell': 'selling',
    'Buy': 'buying'
}

let viewOrderMap = {
    "buying": "Buy",
    "selling": "Sell"
}

let orderClassMap = {
    'Sell': 'sell-count',
    'Buy': 'buy-count'
}

function generateLogText(log,itemName,items) {
    let item = items[itemName];
    let playerName = log.shop.playerName;
    let orderType = log.shop.orderType;
    let commonItemName = item == undefined ? "undef" : item.name;

    let itemPriceText;
    if(log.unitPrice != null) {
        let stackSize = item.stack;
        let stackPrice = log.unitPrice * stackSize;

        if(log.unitPrice < 1) {
            itemPriceText = adjustPrice(stackPrice,true,null) + ' per stack'
        } else {
            itemPriceText = adjustPrice(log.unitPrice,true,null) + ' each';
        }
    }

    let playerText = `${log.shop.playerName}`
    let orderText = `<span class="${orderClassMap[orderType]}">${orderViewMap[orderType]}</span> ${commonItemName}`

    let text = "";

    switch(log['type']) {
        case "Restocked":
            text = `${playerText}'s shop ${orderText} was restocked.`;
            break;
        case "Out of Stock":
            text = `${playerText}'s shop ${orderText} is out of stock.`;
            break;
        case "New Price":
            let prevUnitPrice = log.prevUnitPrice;
            let unitPrice = log.unitPrice;

            if(unitPrice == 0) text = `${playerText} is ${orderText} for ${itemPriceText}`;
            else if(prevUnitPrice == 0) text = `${playerText} is ${orderText} for ${itemPriceText} (previously free)`;
            else {
                let percentChange = Math.round(100 *(unitPrice - prevUnitPrice) / prevUnitPrice);
                let dir = percentChange < 0 ? 'less' : 'more';
                let positivePercentChange = Math.abs(percentChange);
    
                text = `${playerText} is ${orderText} for ${itemPriceText} (${positivePercentChange}% ${dir}).`;
    
            }
            break;
        case "New":
            text = `${playerText} is ${orderText} for ${itemPriceText}.`;
            break;
    }

    return text;
}