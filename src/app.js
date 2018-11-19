const express = require('express')

const logger = require('morgan')
const bodyParser = require('body-parser')

const resMiddleware = require('./middleware/res')

const AppService = require('./service')

module.exports = (config) => {
  const appService = new AppService(config)

  const app = express()
  app.set('json spaces', 0)
  app.use(logger('dev', {
    skip: (req, res) => res.nolog === true || app.nolog === true
  }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: false
  }))

  app.use(resMiddleware)

  app.get('/provisioning', (req, res) => res.status(200).send('#hello world'))
  if (process.env.NODE_ENV === 'test') 
    app.get('/test/provisioning', (req, res) => res.status(200).send('#hello world'))
  app.get('/', (req, res) => res.status(200).send('#hello world'))

  if (process.env.NODE_ENV === 'test') {
    app.use('/test/provisioning/certificate', require('./router/certificate')(appService))
    app.use('/test/provisioning/token', require('./router/token')())
  } else {
    app.use('/provisioning/certificate', require('./router/certificate')(appService))
    app.use('/provisioning/token', require('./router/token')())
  }

  app.use(function (req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
  })

  /* eslint-disable */
  app.use(function (err, req, res, next) {
    if (err) {
      console.log('::', err)
    }

    res.status(err.status || 500).json({
      code: err.code,
      message: err.message,
      where: err.where
    })
  })

  return app
}