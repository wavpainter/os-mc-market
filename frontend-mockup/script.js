// State machine
let displayingItems = false;
let displayingViewedItem = false;
let viewedItemName = null;
let viewedListingType = null;
let useOSMDollars = true;

// Data
let aggregated = null;
let locations = null;
let orders = null;
let items = null;
let dataError = false;

// Other
let diamondSellMedian = null;

function ele(id) {
    return document.getElementById(id);
}

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

function viewItems() {
    let divAvailableItems = ele("available-items");
    let divItemDetails = ele("item-details");

    divAvailableItems.setAttribute("style","display: block;")
    divItemDetails.setAttribute("style","display: none;");
}

function viewItemListings(itemName,saleType) {
    let divAvailableItems = ele("available-items");
    let divItemDetails = ele("item-details");

    displayingViewedItem = false;
    viewedItemName = itemName;
    viewedListingType = saleType;
    displayItemListings();

    divAvailableItems.setAttribute("style","display: none;")
    divItemDetails.setAttribute("style","display: block;");
}

function adjustPrice(price) {
    if(useOSMDollars || price == 0 || diamondSellMedian == null) return "$" + price.toFixed(2);
    else return "d/" + Math.round(diamondSellMedian / price);
}

function displayItemListings() {
    if(!displayingViewedItem && viewedItemName != null && viewedListingType != null && aggregated != null && items != null && orders != null) {
        displayingViewedItem = true;

        let itemDetails = items[viewedItemName];
        let itemAggregate = aggregated[viewedItemName];

        let itemOrders = orders.filter(order => {
            return order['item'] == viewedItemName && order['order_type'] == viewedListingType;
        })
        let count = itemOrders.length;

        ele('listing-icon').setAttribute('src','/items/'+itemDetails['id'].replace(':','_') + '.png');
        ele('listing-common-name').textContent = itemDetails['name'];
        ele('listing-id').textContent = "ID " + itemDetails['id'] + " [" + viewedItemName + "]";

        ele('listing-switch').textContent = "Switch to " + (viewedListingType == "Buy" ? "Sell" : "Buy") + " Orders";
        ele('listing-orders').textContent = viewedListingType + " Orders:";

        if(count == 0) {
            ele('listing-mean').textContent = "Mean: NaN";
            ele('listing-median').textContent = "Median: NaN";
        } else {
            ele('listing-mean').textContent = "Mean: " + adjustPrice(itemAggregate[viewedListingType]['mean']);
            ele('listing-median').textContent = "Median: " + adjustPrice(itemAggregate[viewedListingType]['median']);
        }

        console.log(ele('listing-table').children)
        let rows = ele('listing-table').rows
        for(let i = 1; i < rows.length; i++) {

        }

        itemOrders.forEach(order => {
            let row = ele('listing-table').insertRow();
            let cSeller = row.insertCell();
            let cUnit = row.insertCell();
            let cStack = row.insertCell();
            let cLocation = row.insertCell();
    
            cSeller.textContent = order['player_name'];
            cUnit.textContent = adjustPrice(order['price'] / order['quantity']);
            cStack.textContent = adjustPrice(itemDetails['stack'] * order['price'] / order['quantity']);
            cLocation.textContent = order['location'].join(" > ");
        })

    }
}

function displayItems() {
    if (!displayingItems && aggregated != null && items != null) {
        // Display items
        displayingItems = true;
        view = "items";
        let availableItemsTable = ele("item-table");
        Object.keys(items).forEach(itemName => {
            let item = items[itemName];
            let aggregatedData = aggregated[itemName];

            let sellCount = aggregatedData == undefined ? 0 : aggregatedData['Sell']['count'];
            let buyCount = aggregatedData == undefined ? 0 : aggregatedData['Buy']['count'];

            let row = availableItemsTable.insertRow();
            let name = row.insertCell(0);
            let selling = row.insertCell(1);
            let buying = row.insertCell(2);

            selling.classList.add('bcell');
            buying.classList.add('bcell');

            let iconEle = document.createElement('img');
            iconEle.setAttribute('src','/items/' + item['id'].replace(':','_') + '.png');
            iconEle.setAttribute('width','48');
            iconEle.setAttribute('height','48');

            let sellButton = document.createElement('button');
            sellButton.textContent = sellCount;
            if(sellCount == 0) sellButton.disabled = true;
            sellButton.onclick = event => {
                viewItemListings(itemName,"Sell");
            }

            let buyButton = document.createElement('button');
            buyButton.textContent = buyCount;
            if(buyCount == 0) buyButton.disabled = true;
            buyButton.onclick = event => {
                viewItemListings(itemName,"Buy");
            }

            name.appendChild(iconEle);
            selling.appendChild(sellButton);
            buying.appendChild(buyButton);
        })
    }
}

window.onload = event => {
    fetchJSON("/data/aggregated.json").then(data => {
        aggregated = data;
        if(aggregated['DIAMOND']['Sell']['count'] != 0) {
            diamondSellMedian = aggregated['DIAMOND']['Sell']['median'];
        }
        displayItems();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON("/data/locations.json").then(data => {
        locations = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON("/data/orders.json").then(data => {
        orders = data;
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