/*
 * Filename: /home/jackyang/Documents/provisioning-server/src/index.js
 * Path: /home/jackyang/Documents/provisioning-server
 * Created Date: Monday, November 19th 2018, 10:58:51 am
 * Author: JackYang
 * 
 * Copyright (c) 2018 Wisnuc Inc
 */
const AWS = require('aws-sdk')
const CreateApp = require('./app')

const ssm = new AWS.SSM({
  region: 'cn-north-1'
})

ssm.getParameters({
  Names: ['iot', 'rds', 'rds-test']
}, (err, data) => {
  if (err) throw err
  let params = data.Parameters.reduce((a, c) => (a[c.Name] = JSON.parse(c.Value), a),  {})
  let app = CreateApp(params)
  app.listen(process.env.PORT || 80, error => {
    if (error) console.log('server start error. ', error)
    console.log('server started on port', process.env.PORT || 80)
  })
})