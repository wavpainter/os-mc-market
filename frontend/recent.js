// State machine

// Data
let timestamp = null;
let items = null;
let recent = null;
let dataError = false;

window.onload = event => {
    
    fetchJSON("https://api.os-mc-market.net/locations.json").then(data => {
        locations = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });

    fetchJSON("/items/items.json").then(data => {
        items = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });

    fetchJSON("https://api.os-mc-market.net/recent_updates.json").then(data => {
        recent = data;
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}