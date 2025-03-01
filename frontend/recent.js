// Env
let APIORIGIN = "http://127.0.0.1:8787"

// State machine

// Data
let timestamp = null;
let items = null;
let recent = null;
let dataError = false;

window.onload = event => {
    
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