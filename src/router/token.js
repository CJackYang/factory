/*
 * Filename: /home/jackyang/Documents/provisioning-server/src/router/token.js
 * Path: /home/jackyang/Documents/provisioning-server
 * Created Date: Thursday, October 11th 2018, 1:52:19 pm
 * Author: JackYang
 * 
 * Copyright (c) 2018 Wisnuc Inc
 */

const Router = require('express').Router
const jwt = require('jwt-simple')

const secret = 'aaaacc'

module.exports = () => {
  const router = Router()

  router.get('/', (req, res) => {
    let key = req.query.key
    if (key === 'aabbcc') {
      return res.success({
        type: 'JWT',
        token: jwt.encode({
          key,
          time: new Date().getTime()
        }, secret)
      })
    }
    
    return res.error(Object.assign(new Error('Permission Denied'), { status: 401 }))
  })

  return router
}