// Env
let APIORIGIN = "https://api.os-mc-market.net"

window.onload = event => {
    fetchJSON(APIORIGIN + "/market_data.json").then(data => {
        timestamp = data['timestamp'];
        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
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
    });
}