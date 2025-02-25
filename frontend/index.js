// State machine
let displayingItems = false;
let displayingViewedItem = false;
let viewedItemName = null;
let viewedListingType = null;
let useOSMDollars = true;
let usingOSMDollars = true;
let showUnlisted = false;
let showingUnlisted = false;
let hiddenChanged = false;

// Data
let timestamp = null;
let locations = null;
let hidden = null;
let orders = null;
let orders_itemCount = null;
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

function hideOrder(order) {
    let orderKey = getOrderKey(order);
    hidden[orderKey] = timestamp;
    updateHidden();

    hiddenChanged = true;
    displayItemListings();
}

function unhideOrder(order) {
    let orderKey = getOrderKey(order);
    delete hidden[orderKey];
    updateHidden();

    hiddenChanged = true;
    displayItemListings();
}

function adjustPrice(price) {
    if(useOSMDollars || price == 0 || diamondSellMedian == null) return "$" + price.toFixed(2);
    else return (diamondSellMedian / price).toFixed(1);
}

function appendOrderListing(itemDetails,order,isHidden) {
    let row = ele('listing-table').insertRow();
    row.classList.add('listing-table-row');
    if(isHidden) {
        row.classList.add('listing-hidden');
    }

    let cSeller = row.insertCell();
    let cUnit = row.insertCell();
    let cStack = row.insertCell();
    let cLocation = row.insertCell();
    let cCoords = row.insertCell();
    let cHide = row.insertCell();

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

    cHide.classList.add('listing-table-cell');

    let hideBtn = document.createElement('a');
    hideBtn.classList.add('btn');
    hideBtn.classList.add('nav-box-gradient');
    hideBtn.classList.add('hide-btn');
    hideBtn.setAttribute('href','javascript:void(0);');
    hideBtn.onclick = isHidden ? () => unhideOrder(order) : () => hideOrder(order);
    cHide.appendChild(hideBtn);

    let hideImg = document.createElement('img');
    if(isHidden) {
        hideImg.setAttribute('src','/images/view.png');
    } else {
        hideImg.setAttribute('src','/images/hide.png');
    }
    hideImg.classList.add('table-icon');
    hideBtn.appendChild(hideImg);
}

function displayItemListings() {
    if(!(displayingViewedItem && (useOSMDollars == usingOSMDollars) && !hiddenChanged) 
        && viewedItemName != null && hidden != null && viewedListingType != null && items != null && orders != null) {
        usingOSMDollars = useOSMDollars;
        displayingViewedItem = true;
        hiddenChanged = false;

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

        let hiddenOrders = [];

        // Add 
        itemOrders.forEach(order => {
            let orderKey = getOrderKey(order);
            if(orderKey in hidden) {
                hiddenOrders.push(order);
                return;
            }

            appendOrderListing(itemDetails,order,false);            
        })

        hiddenOrders.forEach(order => {
            appendOrderListing(itemDetails,order,true);
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
            if(itemCount == undefined) return;

            let sellCount = itemCount['Sell'];
            if(sellCount == undefined) sellCount == 0;

            let buyCount = itemCount['Buy'];
            if(buyCount == undefined) buyCount == 0;

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

function loadHidden() {
    const hiddenItems = localStorage.getItem("hiddenItems");
    if(hiddenItems == null) {
        hidden = {};
    } else {
        hidden = JSON.parse(hiddenItems);
    }
}

function updateHidden() {
    if(hidden == null) return;

    const hiddenItems = JSON.stringify(hidden);
    try {
        localStorage.setItem("hiddenItems",hiddenItems);
    }catch(e) {
        localStorage.removeItem("hiddenItems");
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
    loadHidden();

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

    fetchJSON("https://api.os-mc-market.net/market_data").then(data => {
        orders = data['orders'];
        timestamp = data['timestamp'];

        orders_itemCount = {};
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
        })

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