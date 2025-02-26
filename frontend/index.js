// State machine
let displayingItems = false;
let displayingViewedItem = false;
let viewedItemName = null;
let viewedListingType = null;
let useOSMDollars = true;
let usingOSMDollars = true;
let showUnlisted = false;
let showingUnlisted = false;

// Data
let timestamp = null;
let locations = null;
let orders = null;
let orders_itemCount = null;
let orders_diamondMedian = null;
let items = null;
let dataError = false;

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


function adjustPrice(price) {
    if(useOSMDollars || price == 0 || orders_diamondMedian == null) return "$" + price.toFixed(2);
    else return (orders_diamondMedian / price).toFixed(1);
}

function appendOrderListing(itemDetails,order) {
    let row = ele('listing-table').insertRow();
    row.classList.add('listing-table-row');

    let cSeller = row.insertCell();
    let cUnit = row.insertCell();
    let cStack = row.insertCell();
    let cLocation = row.insertCell();
    let cStock = row.insertCell();

    if(order['order_type'] == 'Sell') {
        ele('stock-header').innerText = 'Stock'

        cStock.classList.add('listing-table-cell');
        cStock.classList.add('listing-table-stock');
        let indicator = document.createElement('span');
        indicator.classList.add('stock-indicator');
        if(order['stock'] == 0) {
            indicator.classList.add('stock-red');
        } else {
            indicator.classList.add('stock-green')
        }
        cStock.appendChild(indicator);
        let stockLevel = document.createElement('span');
        stockLevel.classList.add('hover-cell');
        stockLevel.textContent = order['stock']
        cStock.appendChild(stockLevel);
    }else {
        console.log(ele('stock-header'))
        ele('stock-header').innerText = ''
    }

    
    cSeller.textContent = order['player_name'];
    cSeller.classList.add('listing-table-cell');
    cSeller.classList.add('first-cell');
    cUnit.textContent = adjustPrice(order['price'] / order['quantity']);
    cUnit.classList.add('listing-table-cell');
    cStack.textContent = adjustPrice(itemDetails['stack'] * order['price'] / order['quantity']);
    cStack.classList.add('listing-table-cell');
    cLocation.textContent = order['location'].join(" > ");
    cLocation.classList.add('listing-table-cell');

    let coords = document.createElement('span');
    coords.classList.add('hover-cell')
    coords.textContent = order['x'] + " " + order['y'] + " " + order['z'];
    cLocation.appendChild(coords);

}

function displayItemListings() {
    if(!(displayingViewedItem && (useOSMDollars == usingOSMDollars)) 
        && viewedItemName != null && viewedListingType != null && items != null && orders != null) {
        usingOSMDollars = useOSMDollars;
        displayingViewedItem = true;

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

        if(viewedListingType != 'Sell') {
            ele('selling-tab').onclick = () => viewItemListings(viewedItemName,'Sell');
        }

        if(viewedListingType != 'Buy') {
            ele('buying-tab').onclick = () => viewItemListings(viewedItemName,'Buy');
        }

        /*
        ele('listing-orders').textContent = viewedListingType + " Orders:";

        if(count == 0) {
            ele('listing-mean').textContent = "Mean: NaN";
            ele('listing-median').textContent = "Median: NaN";
        } else {
            ele('listing-mean').textContent = "Mean: " + adjustPrice(itemAggregate[viewedListingType]['mean']);
            ele('listing-median').textContent = "Median: " + adjustPrice(itemAggregate[viewedListingType]['median']);
        }
        */
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

function displayItems() {
    if (!(displayingItems && (showUnlisted == showingUnlisted)) && items != null && orders != null) {
        showingUnlisted = showUnlisted;
        displayingItems = true;

        // Clear items
        let listingGridItems = ele('listing-grid-items');
        listingGridItems.innerHTML = "";

        // Display items
        view = "items";
        let availableItemsTable = ele("item-table");
        Object.keys(items).forEach(itemName => {
            let item = items[itemName];

            let itemCount = orders_itemCount[itemName];
            if(itemCount == undefined) {
                if(showUnlisted) itemCount = {};
                else return;
            }

            let sellCount = itemCount['Sell'];
            if(sellCount == undefined) sellCount = 0;

            let buyCount = itemCount['Buy'];
            if(buyCount == undefined) buyCount = 0;

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

function updateUnits() {
    useOSMDollars = !ele('units-option').checked;
    displayItemListings();
}

function updateUnlisted() {
    showUnlisted = ele('unlisted-option').checked;
    displayItems();
}

window.onload = event => {
    ele('back-button').onclick = event => {
        viewItems();
    }

    updateUnits();
    ele('units-option').onchange = event => {
        updateUnits();
    }

    updateUnlisted();
    ele('unlisted-option').onchange = event => {
        updateUnlisted();
    }

    fetchJSON("https://api.os-mc-market.net/market_data?cache=1").then(data => {
        orders = data['orders'];
        timestamp = data['timestamp'];

        orders_itemCount = {};

        let diamond_sell_orders = [];
        let diamond_sell_volume = 0;
        orders.forEach(order => {
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
                console.log('Median diamond order:');
                console.log(diamond_sell_orders[i]);
                break;
            }
        }
        

        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
        displayItems();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON("https://storage.googleapis.com/os-mc-market/locations.json").then(data => {
        locations = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON("/items/items.json").then(data => {
        items = data;
        displayItems();
        displayItemListings();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}