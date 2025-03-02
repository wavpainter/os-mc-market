// Env
let APIORIGIN = "https://api.os-mc-market.net"

// State machine
let displayingRecent = false;
let filtersApplied = false;
let filtersShowing = new Set(['New', 'Out of Stock','New Price','Restocked']);

// Data
let timestamp = null;
let items = null;
let items_idLookup = null;
let recent = null;
let dataError = false;


function displayRecentLog() {
    if(!(displayingRecent || filtersApplied) && recent != null && items != null) {
        displayRecent = true;
        filtersApplied = true;

        let recentLog = ele('recent-log')
        
        recentLog.innerHTML = "";

        recent.forEach(log => {
            try{
                let shop = log.shop;
                let itemId = shop.itemId;
                let itemName = items_idLookup[itemId];

                let hoursSince = Math.floor((new Date().getTime() - new Date(log.at).getTime()) / (1000 * 60 * 60));

                if(itemName == null || !filtersShowing.has(log.type)) return;

                let logEle = document.createElement('a');
                logEle.setAttribute('href','/?item=' + itemName.toLowerCase() + '&view=' + orderViewMap[shop.orderType]);
                logEle.classList.add(...['btn','nav-box-gradient','rlog'])

                let iconEle = document.createElement('img');
                iconEle.classList.add('recent-icon');
                iconEle.setAttribute('src','/items/' + itemId.replaceAll(':','_') + '.png');


                let logTextEle = document.createElement('div');
                logTextEle.classList.add('log-text');
                logTextEle.innerHTML = generateLogText(log,itemName,items);

                let recentTimeEle = document.createElement('div');
                recentTimeEle.classList.add('recent-time');
                if(hoursSince == 0) {
                    recentTimeEle.innerText = "Just Now";
                }else {
                    recentTimeEle.innerText = `${hoursSince}h ago`
                }

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

                logEle.appendChild(iconEle);
                logEle.appendChild(recentTagEle);

                logEle.appendChild(logTextEle);
                logEle.appendChild(recentTimeEle);

                recentLog.appendChild(logEle);
            }catch(error) {
                console.log("Error processing log",error);
            }
        })
    }
}

function toggleFilter(target) {
    let filterType;

    switch(target.id) {
        case 'new-shop':
            filterType = 'New';
            break;
        case 'restocked':
            filterType = 'Restocked';
            break;
        case 'new-price':
            filterType = 'New Price';
            break;
        case 'out-of-stock':
            filterType = 'Out of Stock';
            break;
    }

    let isShowing = !filtersShowing.has(filterType);

    if(isShowing) {
        filtersShowing.add(filterType);
    } else {
        filtersShowing.delete(filterType);
    }

    target.classList.remove('filter-disabled');
    if(!isShowing) {
        target.classList.add('filter-disabled');
    }

    filtersApplied = false;
    displayRecentLog();
}

window.onload = event => {
    let eles = document.getElementsByClassName('include-option');
    for(let i=0; i < eles.length; i++) {
        let ele = eles[i];
        ele.onclick = event => {
            toggleFilter(event.target);
        }
    }

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

    fetchJSON(APIORIGIN + "/recent.json").then(data => {
        let nRecent = data.length;
        if(nRecent != undefined) {
            let recentEle = ele("recent-offers-count");
            recentEle.innerText = nRecent;
            recentEle.style.display = "inline-block";
        }
       
        recent = data.sort((a,b) => (new Date(b.at).getTime() - new Date(a.at).getTime()));
        displayRecentLog();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}