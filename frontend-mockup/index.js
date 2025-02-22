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
let aggregated = null;
let locations = null;
let orders = null;
let items = null;
let dataError = false;

// Other
let diamondSellMedian = null;

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
    if(useOSMDollars || price == 0 || diamondSellMedian == null) return "$" + price.toFixed(2);
    else return (diamondSellMedian / price).toFixed(1);
}

function displayItemListings() {
    if(!(displayingViewedItem && (useOSMDollars == usingOSMDollars)) 
        && viewedItemName != null && viewedListingType != null && aggregated != null && items != null && orders != null) {
        usingOSMDollars = useOSMDollars;
        displayingViewedItem = true;

        let itemDetails = items[viewedItemName];
        let itemAggregate = aggregated[viewedItemName];

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
            let row = ele('listing-table').insertRow();
            row.classList.add('listing-table-row');

            let cSeller = row.insertCell();
            let cUnit = row.insertCell();
            let cStack = row.insertCell();
            let cLocation = row.insertCell();
            let cCoords = row.insertCell();
    
            cSeller.textContent = order['player_name'];
            cSeller.classList.add('listing-table-cell');
            cUnit.textContent = adjustPrice(order['price'] / order['quantity']);
            cUnit.classList.add('listing-table-cell');
            cStack.textContent = adjustPrice(itemDetails['stack'] * order['price'] / order['quantity']);
            cStack.classList.add('listing-table-cell');
            cLocation.textContent = order['location'].join(" > ");
            cLocation.classList.add('listing-table-cell');
            cCoords.textContent = order['x'] + " " + order['y'] + " " + order['z'];
            cCoords.classList.add('listing-table-cell');
        })

    }
}

function displayItems() {
    if (!(displayingItems && (showUnlisted == showingUnlisted)) && aggregated != null && items != null) {
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
            let aggregatedData = aggregated[itemName];

            let sellCount = aggregatedData == undefined ? 0 : aggregatedData['Sell']['count'];
            let buyCount = aggregatedData == undefined ? 0 : aggregatedData['Buy']['count'];

            if(!showUnlisted && sellCount == 0 && buyCount == 0) return;

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

    fetchJSON("https://storage.googleapis.com/os-mc-market/market_data.json").then(data => {
        aggregated = data['aggregated'];
        if(aggregated['DIAMOND']['Sell']['count'] != 0) {
            diamondSellMedian = aggregated['DIAMOND']['Sell']['median'];
            //ele('median-diamond-price').textContent = 'MDSP = $' + diamondSellMedian;
        }
        orders = data['orders'];
        timestamp = data['timestamp'];
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