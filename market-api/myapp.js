const express = require('express')
const data = require('./data')

const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/orders',async (req,res) => {
  fileNames = await data.getFiles();
  res.send(fileNames);
})

app.put('/orders',(req,res) => {

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
