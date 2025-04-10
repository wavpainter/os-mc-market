// Env
let APIORIGIN = "https://api.os-mc-market.net"

// State machine
let displayingRecent = false;
let filtersApplied = false;
let filtersShowing = new Set(['New', 'Out of Stock','New Price','Restocked','Removed']);
let hideStock = false;
let hidingStock = false;
let showRemoved = false;
let showingRemoved = false;

// Data
let timestamp = null;
let items = null;
let items_idLookup = null;
let recent = null;
let dataError = false;
let viewedLogs_hasViewed = false;
let viewedLogs = null;
let viewedLogs_initial = null;

function displayRecentLog() {
    if(!(displayingRecent && (hideStock == hidingStock) && (showRemoved == showingRemoved)) && recent != null && items != null && viewedLogs != null) {
        displayRecent = true;
        filtersApplied = true;
        hidingStock = hideStock;
        showingRemoved = showRemoved;

        ele('recent-log-header').style.display = 'block';

        let recentLog = ele('recent-log')
        
        recentLog.innerHTML = "";

        recent.forEach(log => {
            try{
                let shop = log.shop;
                let itemId = shop.itemId;
                let itemName = items_idLookup[itemId];
                let key = getLogKey(log);

                let hoursSince = Math.floor((new Date().getTime() - new Date(log.at).getTime()) / (1000 * 60 * 60));

                viewedLogs[key] = true;

                if(itemName == null) return;
                
                if(!showingRemoved && (log.type == 'Removed')) return;
                if(hideStock && (log.type == 'Restocked' || log.type == 'Out of Stock')) return;

                let logEle = document.createElement('a');
                logEle.setAttribute('href','/?item=' + itemName.toLowerCase() + '&view=' + orderViewMap[shop.orderType]);
                logEle.classList.add(...['log-gradient','rlog'])
                if(viewedLogs_hasViewed && !viewedLogs_initial[key]) logEle.classList.add(['log-new']);

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
                        logEle.classList.add('new-shop-border')
                        recentTagEle.classList.add('new-shop');
                        recentTagEle.innerText = "New Shop";
                        break;
                    case 'Out of Stock':
                        logEle.classList.add('out-of-stock-border')
                        recentTagEle.classList.add('out-of-stock');
                        recentTagEle.innerText = "Out of Stock";
                        break;
                    case 'New Price':
                        logEle.classList.add('improved-prices-border')
                        recentTagEle.classList.add('improved-prices');
                        recentTagEle.innerText = "New Price";
                        break;
                    case 'Restocked':
                        logEle.classList.add('restocked-border')
                        recentTagEle.classList.add('restocked');
                        recentTagEle.innerText = "Restocked";
                        break;
                    case 'Removed':
                        logEle.classList.add('removed-border')
                        recentTagEle.classList.add('removed');
                        recentTagEle.innerText = "Removed";
                        break;
                }
                logEle.appendChild(iconEle);

                logEle.appendChild(logTextEle);

                logEle.appendChild(recentTimeEle);

                logEle.appendChild(recentTagEle);

                recentLog.appendChild(logEle);
            }catch(error) {
                console.log("Error processing log",error);
            }
        })

        updateViewedLogs();
        displayRecentCount();
    }
}

function displayRecentCount() {
    if(recent != null && viewedLogs != null) {

        let nRecent = 0;
        recent.forEach(log => {
            let key = getLogKey(log);
            if(!viewedLogs[key]) {
                console.log(JSON.stringify(log))
                console.log(key);
                nRecent++;
            }
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

    viewedLogs_hasViewed = Object.keys(viewedLogs).length > 0;

    viewedLogs_initial = {};
    Object.keys(viewedLogs).forEach(key => {
        viewedLogs_initial[key] = viewedLogs[key];
    });

    displayRecentCount();
    displayRecentLog();
}

function updateViewedLogs() {
    try{
        let viewedLogsString = JSON.stringify(viewedLogs);
        localStorage.setItem("viewedlogs",viewedLogsString);
    }catch(e) {
        localStorage.removeItem("viewedlogs");
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

function updateHideStock() {
    hideStock = ele('hide-stock-option').checked;
    displayRecentLog();
}

function updateShowRemoved() {
    showRemoved = ele('show-removed-option').checked;
    displayRecentLog();
}

window.onload = event => {
    loadViewedLogs();

    updateHideStock();
    ele('hide-stock-option').onchange = event => {
        updateHideStock();
    }

    updateShowRemoved();
    ele('show-removed-option').onchange = event => {
        updateShowRemoved();
    }


    /*let eles = document.getElementsByClassName('include-option');
    for(let i=0; i < eles.length; i++) {
        let ele = eles[i];
        ele.onclick = event => {
            toggleFilter(event.target);
        }
    }*/

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
        recent = data.sort((a,b) => (new Date(b.at).getTime() - new Date(a.at).getTime()));
        displayRecentCount();
        displayRecentLog();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}