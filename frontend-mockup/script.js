
// State machine
let displayingItems = false;

// Data
let aggregated = null;
let locations = null;
let orders = null;
let items = null;
let dataError = false;

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

function dataUpdated() {
    if(dataError) {
        // Hide page and show error

    } else {
        if (!displayingItems && aggregated != null && items != null) {
            // Display items
            displayingItems = true;
            let availableItemsTable = document.getElementById("available-items");
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
                iconEle.setAttribute('src','/items/' + item['id'].replace(':','_') + '.png')
                iconEle.setAttribute('width','48')
                iconEle.setAttribute('height','48')

                name.appendChild(iconEle);
                selling.textContent = sellCount;
                buying.textContent = buyCount;
            })
        }
    }
}

window.onload = event => {
    fetchJSON("/data/aggregated.json").then(data => {
        aggregated = data;
        dataUpdated();
    }).catch(error => {
        console.error(error);
        dataError = true;
        dataUpdated();
    });
    fetchJSON("/data/locations.json").then(data => {
        locations = data;
        dataUpdated();
    }).catch(error => {
        console.error(error);
        dataError = true;
        dataUpdated();
    });
    fetchJSON("/data/orders.json").then(data => {
        orders = data;
        dataUpdated();
    }).catch(error => {
        console.error(error);
        dataError = true;
        dataUpdated();
    });
    fetchJSON("/items/items.json").then(data => {
        items = data;
        dataUpdated();
    }).catch(error => {
        console.error(error);
        dataError = true;
        dataUpdated();
    });
}