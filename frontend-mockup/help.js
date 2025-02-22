window.onload = event => {
    fetchJSON("https://storage.googleapis.com/os-mc-market/market_data.json").then(data => {
        timestamp = data['timestamp'];
        ele('last-updated').textContent = "Last Updated: " + new Date(timestamp).toLocaleString();
    }).catch(error => {
        console.error(error);
        dataError = true;
    });
}