// Env
let APIORIGIN = "https://api.os-mc-market.net"

// State machine
let handledParams = false;
let displayingItems = false;
let displayingViewedItem = false;
let viewedItemName = null;
let viewedListingType = null;
let usePlayerCount = false;
let usingPlayerCount = false;
let showUnlisted = false;
let showingUnlisted = false;
let hideOOS = false;
let hidingOOS = false;
let hidingItemOOS = false;
let useOSMDollars = true;

// Data
let timestamp = null;
let volume = null;
let locations = null;
let orders = null;
let orders_itemCount = null;
let orders_inStockCount = null;
let orders_diamondMedian = null;
let orders_itemOrderPlayer = null;
let orders_itemOrderPlayerInStock = null;
let items = null;
let items_idLookup = null;
let dataError = false;
let recent = null;
let viewedLogs = null;

function viewItems() {
    let divAvailableItems = ele("listing-grid");
    let divItemDetails = ele("item-details");

    divAvailableItems.setAttribute("style","display: inline-block;")
    divItemDetails.setAttribute("style","display: none;");
}

function viewItemListings(itemName,saleType) {
    let divAvailableItems = ele("listing-grid");
    let divItemDetails = ele("item-details");

    // Set tabs
    let tableTabs = document.getElementsByClassName("table-tab");
    for(let i=0; i < tableTabs.length; i++) {
        tableTabs.item(i).classList.remove('selected-tab');
    }
    if(saleType == "Sell") {
        ele('selling-tab').classList.add('selected-tab');
    }else {
        ele('buying-tab').classList.add('selected-tab');
    }

    displayingViewedItem = false;
    viewedItemName = itemName;
    viewedListingType = saleType;
    displayItemListings();

    divAvailableItems.setAttribute("style","display: none;")
    divItemDetails.setAttribute("style","display: inline-block;");
}


function appendOrderListing(itemDetails,order) {
    let isOOS = false;
    if((order['order_type'] == 'Sell' && order['stock'] == 0) || 
    (order['order_type'] == 'Buy' && order['bal'] < order['price'])) {
        isOOS = true;
    }

    if(hideOOS && isOOS) {
        return;
    }

    let row = ele('listing-table').insertRow();
    row.classList.add('listing-table-row');

    let cSeller = row.insertCell();
    let cUnit = row.insertCell();
    let cStack = row.insertCell();
    let cStock = row.insertCell();
    let cLocation = row.insertCell();

    cStock.classList.add('listing-table-cell');
    cStock.classList.add('listing-table-stock');

    if(order['order_type'] == 'Sell') {
        cStock.textContent = order['stock'];
    }else {
        cStock.textContent = adjustPrice(order['bal'],true,null);
    }

    if(isOOS) {
        cStock.classList.add('stock-red');
    }
    
    cSeller.textContent = order['player_name'];
    cSeller.classList.add('listing-table-cell');
    cSeller.classList.add('first-cell');
    cSeller.classList.add('left-align-cell');
    cUnit.textContent = adjustPrice(order['price'] / order['quantity'],useOSMDollars,orders_diamondMedian);
    cUnit.classList.add('listing-table-cell');
    cUnit.classList.add('listing-table-price');
    cStack.textContent = adjustPrice(itemDetails['stack'] * order['price'] / order['quantity'],useOSMDollars,orders_diamondMedian);
    cStack.classList.add('listing-table-cell');
    cStack.classList.add('listing-table-price');

    let coordsText = order['x'] + " " + order['y'] + " " + order['z'];
    cLocation.classList.add('listing-table-cell');

    if(order['location'].length > 0) {
        cLocation.textContent = order['location'].join(" > ");
        cLocation.classList.add('hover-text');
        let coords = document.createElement('span');
        coords.classList.add('hover-cell')
        coords.textContent = coordsText;
        cLocation.appendChild(coords);
    } else {
        cLocation.textContent = coordsText;
    }
    console.log(order['location'])




}

function displayItemListings() {
    if(!(displayingViewedItem && (hideOOS == hidingItemOOS)) 
        && viewedItemName != null && viewedListingType != null && items != null && orders != null) {
        displayingViewedItem = true;
        hidingItemOOS = hideOOS;

        let itemDetails = items[viewedItemName];
        let itemOrders = orders.filter(order => {
            return order['item'] == viewedItemName && order['order_type'] == viewedListingType;
        })
        let compareFn = viewedListingType == 'Sell' ? (a,b) => a['price'] / a['quantity'] - b['price'] / b['quantity'] : (b,a) => a['price'] / a['quantity'] - b['price'] / b['quantity'];
        itemOrders = itemOrders.sort(compareFn);
        let count = itemOrders.length;

        ele('item-img').setAttribute('src','/items/'+itemDetails['id'].replace(':','_') + '.png');
        ele('item-name').textContent = itemDetails['name'];
        let divItemId = ele('item-id');
        divItemId.setAttribute('title', itemDetails['id'] + " [" + viewedItemName + "]");
        divItemId.onclick = event => {
            navigator.clipboard.writeText(itemDetails['id']);
        };

        if(viewedListingType == 'Buy') {
            ele('selling-tab').onclick = () => viewItemListings(viewedItemName,'Sell');
            ele('stock-header').innerText = 'Bal'
        } else {
            ele('buying-tab').onclick = () => viewItemListings(viewedItemName,'Buy');
            ele('stock-header').innerText = 'Stock'
        }

        let table = ele('listing-table')
        let rows = table.rows
        for(let i = rows.length - 1; i > 0; i--) {
            table.deleteRow(i);
        }


        // Add 
        itemOrders.forEach(order => {
            let orderKey = getOrderKey(order);
            appendOrderListing(itemDetails,order,false);            
        })

    }
}

function displayRecentCount() {
    if(recent != null && viewedLogs != null) {

        let nRecent = 0;
        recent.forEach(log => {
            let key = getLogKey(log);
            if(!viewedLogs[key]) nRecent++;
        })

        let recentEle = ele("recent-offers-count");

        if(nRecent == 0) {
            recentEle.style.display = "none";
        } else {
            recentEle.innerText = nRecent;
            recentEle.style.display = "inline-block";
        }
    }
}

function displayItems() {
    if (!(displayingItems && (showUnlisted == showingUnlisted) && (hideOOS == hidingOOS) && (usePlayerCount == usingPlayerCount)) && items != null && orders != null) {
        showingUnlisted = showUnlisted;
        hidingOOS = hideOOS;
        usingPlayerCount = usePlayerCount;
        displayingItems = true;

        // Clear items
        let listingGridItems = ele('listing-grid-items');
        listingGridItems.innerHTML = "";

        ele('metric').innerText = usePlayerCount ? 'players' : 'shops';
        ele('volume').innerText = adjustPrice(volume,true,null);

        // Display items
        view = "items";
        Object.keys(items).forEach(itemName => {
            let item = items[itemName];

            let itemCount = null;
            if(hideOOS) {
                itemCount = orders_inStockCount[itemName];
            } else {
                itemCount = orders_itemCount[itemName];
            }


            if(itemCount == undefined || (itemCount['Sell'] == 0 && itemCount['Buy'] == 0)) {
                if(showUnlisted) itemCount = {};
                else return;
            }

            let sellCount, buyCount;
            if(!usePlayerCount) {
                sellCount = itemCount['Sell'];
                if(sellCount == undefined) sellCount = 0;
    
                buyCount = itemCount['Buy'];
                if(buyCount == undefined) buyCount = 0;
            } else {
                let x = null;
                if(hideOOS) {
                    x = orders_itemOrderPlayerInStock[itemName];
                } else {
                    x = orders_itemOrderPlayer[itemName];
                }
                if(x == undefined){
                    sellCount = 0;
                    buyCount = 0;
                }
                else {
                    sellCount = x['Sell'].size;
                    buyCount = x['Buy'].size;
                }
            }
            
            let itemBox = document.createElement('div');
            itemBox.classList.add('item-box');
            listingGridItems.appendChild(itemBox);

            let itemBoxImg = document.createElement('img');
            itemBoxImg.classList.add('item-box-img');
            itemBoxImg.setAttribute('src','/items/' + item['id'].replace(':','_') + '.png');
            itemBoxImg.onclick = event => {
                viewItemListings(itemName,"Sell");
            }
            itemBox.appendChild(itemBoxImg);

            let itemBoxSell = document.createElement('a');
            itemBoxSell.href = "#";
            itemBoxSell.classList.add(...['item-box-sell','item-box-count','sell-count']);
            itemBoxSell.textContent = sellCount;
            itemBoxSell.onclick = event => {
                viewItemListings(itemName,"Sell");
            }
            itemBox.appendChild(itemBoxSell);

            let itemBoxBuy = document.createElement('a');
            itemBoxBuy.href = "#";
            itemBoxBuy.classList.add(...['item-box-buy','item-box-count','buy-count']);
            itemBoxBuy.textContent = buyCount;
            itemBoxBuy.onclick = event => {
                viewItemListings(itemName,"Buy");
            }
            itemBox.appendChild(itemBoxBuy);

        })
    }
}

function displayRecentCount() {
    if(recent != null && viewedLogs != null) {

        let nRecent = 0;
        recent.forEach(log => {
            let key = getLogKey(log);
            if(!viewedLogs[key]) nRecent++;
        })

        let recentEle = ele("recent-offers-count");

        if(nRecent == 0) {
            recentEle.style.display = "none";
        } else {
            recentEle.innerText = nRecent;
            recentEle.style.display = "inline-block";
        }
    }
}

function loadViewedLogs() {
    try{
        let viewedLogsString = localStorage.getItem("viewedlogs");
        if(viewedLogsString != null) {
            viewedLogs = JSON.parse(viewedLogsString);

        } else {
            viewedLogs = {};
        }
    }catch(e) {
        localStorage.removeItem("viewedlogs");
        viewedLogs = {};
    }

    displayRecentCount();
}

function handleParams() {
    if (!(handledParams) && items != null && orders != null) {
        handleParams = true;

        let params = new URLSearchParams(document.location.search);

        let item = params.get("item");
        let view = params.get("view");
        if(view == null) view = "selling";

        if(item == null) return;
        item = item.toUpperCase();
        view = view.toLowerCase();

        if(items[item] == undefined || viewOrderMap[view] == undefined) return;

        viewItemListings(item,viewOrderMap[view]);
    }
}

function updateNumber() {
    usePlayerCount = !ele('number-option').checked;
    displayItems();
}

function updateUnlisted() {
    showUnlisted = ele('unlisted-option').checked;
    displayItems();
}

function updateHideOOS() {
    hideOOS = !ele('hide-oos-option').checked;
    displayItems();
    displayItemListings();
}

window.onload = event => {
    ele('back-button').onclick = event => {
        viewItems();
    }

    updateNumber();
    ele('number-option').onchange = event => {
        updateNumber();
    }

    updateUnlisted();
    ele('unlisted-option').onchange = event => {
        updateUnlisted();
    }

    updateHideOOS();
    ele('hide-oos-option').onchange = event => {
        updateHideOOS();
    }

    loadViewedLogs();

    fetchJSON(APIORIGIN + "/market_data.json").then(data => {
        orders = data['orders'];
        timestamp = data['timestamp'];
        volume = data['volume'];

        orders_itemOrderPlayer = {};
        orders_itemOrderPlayerInStock = {};
        orders_itemCount = {};
        orders_inStockCount = {};

        let diamond_sell_orders = [];
        let diamond_sell_volume = 0;
        orders.forEach(order => {
            let y1 = orders_itemOrderPlayer[order['item']];

            if(y1 == undefined) {
                y1 = {
                    'Buy': new Set(),
                    'Sell': new Set()
                }
            }

            y1[order['order_type']].add(order['player_name']);

            orders_itemOrderPlayer[order['item']] = y1;

            y1 = orders_itemOrderPlayerInStock[order['item']];

            if(y1 == undefined) {
                y1 = {
                    'Buy': new Set(),
                    'Sell': new Set()
                }
            }

            if((order['order_type'] == 'Buy' && order['bal'] >= order['price'])
            || (order['order_type'] == 'Sell' && order['stock'] > 0)) {
                y1[order['order_type']].add(order['player_name']);
            }

            orders_itemOrderPlayerInStock[order['item']] = y1;

            let x = orders_itemCount[order['item']];
            if(x == undefined) {
                x = {
                    'Buy': 0,
                    'Sell': 0
                }
            }

            if(order['order_type'] == 'Buy') {
                x['Buy']++;
            } else {
                x['Sell']++;
            }

            orders_itemCount[order['item']] = x;

            x = orders_inStockCount[order['item']];
            if(x == undefined) {
                x = {
                    'Buy': 0,
                    'Sell': 0
                }
            }

            if(order['order_type'] == 'Buy') {
                if(order['bal'] >= order['price']) {
                    x['Buy']++;
                }
            } else {
                if(order['stock'] > 0) {
                    x['Sell']++;
                }
            }

            orders_inStockCount[order['item']] = x;
            console.log("orders_inStockCount:")
            console.log(orders_inStockCount)

            if(order['item'] == 'DIAMOND' && order['order_type'] == 'Sell') {
                diamond_sell_orders.push(order);
                diamond_sell_volume += order['stock'];
            }
        })

        diamond_sell_orders.sort((a,b) => {
            return a['unit_price'] - b['unit_price']
        });

        let medianVolume = Math.floor(diamond_sell_volume / 2) + 1;
        let current_volume = 0;
        for(let i = 0; i < diamond_sell_orders.length; i++) {
            current_volume+= diamond_sell_orders[i]['stock'];
            if(current_volume > medianVolume) {
                orders_diamondMedian = diamond_sell_orders[i]['unit_price'];
                break;
            }
        }
        

        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
        displayItems();
        handleParams();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON(APIORIGIN + "/locations.json").then(data => {
        locations = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON(APIORIGIN + "/items.json").then(data => {
        items = data;
        items_idLookup = {};
        Object.keys(items).forEach(itemName => {
            items_idLookup[items[itemName]['id']] = itemName;
        })

        displayItems();
        displayItemListings();
        handleParams();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON(APIORIGIN + "/recent.json").then(data => {
        recent = data.sort((a,b) => (new Date(b.at).getTime() - new Date(a.at).getTime()));

        displayRecentCount();
    });

}