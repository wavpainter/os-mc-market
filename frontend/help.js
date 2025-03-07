// Data
let recent = null;
let viewedLogs = null;

// Env
let APIORIGIN = "https://api.os-mc-market.net"

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

window.onload = event => {
    loadViewedLogs();

    fetchJSON(APIORIGIN + "/market_data.json").then(data => {
        timestamp = data['timestamp'];
        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
    fetchJSON(APIORIGIN + "/recent.json").then(data => {
        recent = data.sort((a,b) => (new Date(b.at).getTime() - new Date(a.at).getTime()));

        displayRecentCount();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}