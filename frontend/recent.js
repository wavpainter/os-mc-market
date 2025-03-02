// Env
let APIORIGIN = "https://api.os-mc-market.net"

// State machine

// Data
let timestamp = null;
let items = null;
let recent = null;
let dataError = false;

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
    }).catch(error => {
        console.error(error);
        dataError = true;
    });

    fetchJSON(APIORIGIN + "/recent_updates.json").then(data => {
        recent = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}