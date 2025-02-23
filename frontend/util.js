function fetchJSON(url) {
    return new Promise((resolve,reject) => {
        fetch(url).then(response => {
            if(!response.ok) {
                reject("Fetching " + url + " resulted in " + response.status);
            }
            return response.json();
        }).then(data => {
            resolve(data);
        }).catch(error => {
            console.error(error);
            reject("Failed to load " + url);
        })
    })
}

function ele(id) {
    return document.getElementById(id);
}

function getOrderKey(order) {
    return order['player_name'] + ':' + order['item'] + ':' + order['order_type'] + ':' + order['x'] + ':' + order['y'] + ':' + order['z'];
}
