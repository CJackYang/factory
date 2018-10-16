const express = require('express')

const logger = require('morgan')
const bodyParser = require('body-parser')

const resMiddleware = require('./middleware/res')

const AppService = require('./service')
const Config = require('../config/config')

const appService = new AppService(Config)

const app = express()
app.set('json spaces', 0)
app.use(logger('dev', { skip: (req, res) => res.nolog === true || app.nolog === true }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(resMiddleware)

app.use('/certificate', require('./router/certificate')(appService))
app.use('/token', require('./router/token')())

app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

/* eslint-disable */
app.use(function(err, req, res, next) {
  if (err) {
    console.log('::', err)
  }

  res.status(err.status || 500).json({
    code: err.code,
    message: err.message,
    where: err.where
  })
})

app.listen(8888, error => {
  if (error) console.log('server start error. ', error)
  console.log('server started on port 8888')
})