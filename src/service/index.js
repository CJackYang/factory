/*
 * Filename: /home/jackyang/factory/src/service/index.js
 * Path: /home/jackyang/factory
 * Created Date: Friday, September 28th 2018, 5:21:58 pm
 * Author: JackYang
 * 
 * Copyright (c) 2018 Wisnuc Inc
 */

const AWS = require('aws-sdk')
const Promise = require('bluebird')

class AppService {
  constructor (config) {
    this.conf = config
    this.awsConfig = new AWS.Config()
    this.awsConfig.update({
      region: config.iot.region,
      accessKeyId: config.user.accessKeyId,
      secretAccessKey: config.user.secretKey
    })
  }

  get iot() {
    if (!this._Iot) {
      this._Iot = new AWS.Iot(this.awsConfig)
      this._Iot.createCertificateFromCsrAsync = Promise.promisify(this._Iot.createCertificateFromCsr).bind(this._Iot)
    }
    return this._Iot
  }

  destroy() {
    
  }

}

module.exports = AppService