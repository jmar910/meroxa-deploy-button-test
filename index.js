const express = require('express')
const PORT = process.env.PORT || 5000

express()
  .get('/', (req, res) => res.render('Hello World from Meroxa!'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
