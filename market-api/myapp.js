const express = require('express')
const path = require('path')
const data = require('./data');
const { read_json } = require('./util');

const app = express()
const port = 3000;

const refreshPeriodMs = 60000;

let aggregatedData = null;
let ordersData = null;
let lastRefreshMs = null;

let items = read_json('./items.json');

async function refresh() {
  let now = Date.now();
  if(lastRefreshMs == null || (lastRefreshMs + refreshPeriodMs) < now) {
    let files = await data.getFiles();

    let dts = []

    files.forEach(file => {
      dts.push(file.datetime);
    })

    let sorted_dts = dts.sort((a,b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    })

    let latest_dt = sorted_dts[0];
    let filenameSuffix = "_" + latest_dt.replaceAll(':','_') + ".json"

    console.log(filenameSuffix)

    aggregatedData = await data.getFile("aggregated" + filenameSuffix);
    ordersData = await data.getFile("orders" + filenameSuffix);

    lastRefreshMs = now;
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/available-items',async(req,res) => {
  let available_items = {}
  Object.keys(items).forEach(item_name => {
    let aggregate_data
  })
})

app.get('/orders',async (req,res) => {
  res.send(await getLatestOrders());
})

app.get('/aggregate',async (req,res) => {
  res.send(await getLatestAggregate());
})

app.put('/orders',(req,res) => {

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
