// Env
let APIORIGIN = "http://127.0.0.1:8787"

window.onload = event => {
    fetchJSON(APIORIGIN + "/market_data").then(data => {
        timestamp = data['timestamp'];
        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}