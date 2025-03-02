// Env
let APIORIGIN = "https://api.os-mc-market.net"

// State machine
let displayingRecent = false;
let filtersApplied = false;

// Data
let timestamp = null;
let items = null;
let items_idLookup = null;
let recent = null;
let dataError = false;





function displayRecentLog() {
    if(!(displayingRecent) && recent != null && items != null) {
        displayRecent = true;

        let recentLog = ele('recent-log')
        
        recentLog.innerHTML = "";

        recent.forEach(log => {
            try{
                let shop = log.shop;
                let itemId = shop.itemId;
                let itemName = items_idLookup[itemId];

                let hoursSince = Math.floor((new Date().getTime() - new Date(log.at).getTime()) / (1000 * 60 * 60));

                if(itemName == null) return;

                let logEle = document.createElement('a');
                logEle.setAttribute('href','/?item=' + itemName.toLowerCase() + '&view=' + orderViewMap[shop.orderType]);
                logEle.classList.add(...['btn','nav-box-gradient','rlog'])

                let iconEle = document.createElement('img');
                iconEle.classList.add('recent-icon');
                iconEle.setAttribute('src','/items/' + itemId.replaceAll(':','_') + '.png');
                logEle.appendChild(iconEle);

                let logTextEle = document.createElement('div');
                logTextEle.classList.add('log-text');
                logTextEle.innerText = generateLogText(log,itemName,items);
                logEle.appendChild(logTextEle);

                let recentTimeEle = document.createElement('div');
                recentTimeEle.classList.add('recent-time');
                recentTimeEle.innerText = `${hoursSince}h ago`
                logEle.appendChild(recentTimeEle);

                let recentTagEle = document.createElement('div');
                recentTagEle.classList.add('recent-tag');
                recentTagEle.classList.add('recent-tag-inline');
                switch(log.type) {
                    case 'New':
                        recentTagEle.classList.add('new-shop');
                        recentTagEle.innerText = "New Shop";
                        break;
                    case 'Out of Stock':
                        recentTagEle.classList.add('out-of-stock');
                        recentTagEle.innerText = "Out of Stock";
                        break;
                    case 'New Price':
                        recentTagEle.classList.add('improved-prices');
                        recentTagEle.innerText = "New Price";
                        break;
                    case 'Restocked':
                        recentTagEle.classList.add('restocked');
                        recentTagEle.innerText = "Restocked";
                        break;
                }
                logEle.appendChild(recentTagEle);

                recentLog.appendChild(logEle);
            }catch(error) {
                console.log("Error processing log",error);
            }
        })
    }
}

window.onload = event => {
    
    fetchJSON(APIORIGIN + "/market_data.json").then(data => {
        timestamp = data['timestamp'];
        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
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
        displayRecentLog();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });

    fetchJSON(APIORIGIN + "/recent_updates.json").then(data => {
        recent = data;
        displayRecentLog();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}