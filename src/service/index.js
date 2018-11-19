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
const mysql = require('mysql')
const x509 = require('@fidm/x509')

const devicePolicy = require('./devicePolicy')

class AppService {
  constructor (config) {
    this.conf = config
    this.awsConfig = new AWS.Config()
    this.awsConfig.update({
      region: config.iot.region
    })
  }

  get iot() {
    if (!this._Iot) {
      this._Iot = new AWS.Iot(this.awsConfig)
      this._Iot.createCertificateFromCsrAsync = Promise.promisify(this._Iot.createCertificateFromCsr).bind(this._Iot)
      this._Iot.attachPrincipalPolicyAsync = Promise.promisify(this._Iot.attachPrincipalPolicy).bind(this._Iot)
      this._Iot.createPolicyAsync = Promise.promisify(this._Iot.createPolicy).bind(this._Iot)
      this._Iot.attachThingPrincipalAsync = Promise.promisify(this._Iot.attachThingPrincipal).bind(this._Iot)
    }
    return this._Iot
  }

  get pool() {
    if (!this._pool) {
      let dbConf = process.env.NODE_ENV === 'test' ? this.conf['rds-test'] : this.conf.rds
      this._pool = mysql.createPool({
        connectionLimit: 20,
        host: dbConf.host,
        user: dbConf.user,
        password: dbConf.password,
        database: dbConf.dbname
      })
      Promise.promisifyAll(this._pool)
    }
    return this._pool
  }

  destroy () {
    if (this._pool)
      this._pool.end(err => console.log(err))
  }

  certByKeyId (keyId, callback) {
    this.pool.getConnection((err, conn) => {
      if (err) return callback(err)
      conn.query(`select * from deviceCert where keyId = '${ keyId }'`, (err, results) => {
        conn.release()
        if (err) return callback(err)
        if (!results.length) return callback(Object.assign(new Error('not found'), { status: 404 }))
        return callback(null, results[0])
      })
    })
  }

  /* eslint-disable */
  async registByCsr ({ sn, reversion, csr, type }) {

    let data = await this.iot.createCertificateFromCsrAsync({
      certificateSigningRequest: csr,
      setAsActive: true
    })
    
    let certificateId = data.certificateId
    let certificatePem = data.certificatePem
    let certificateArn = data.certificateArn

    // create policy
    let policyName = 'Policy_Device_Iot'
    try {
      await this.iot.createPolicyAsync({ policyDocument: JSON.stringify(devicePolicy), policyName: policyName })
    } catch(e) {
      //Ignore if the policy already exists
      if (!e.code || e.code !== 'ResourceAlreadyExistsException') {
        e.status = 500
        throw e
      }
    }

    // Attach the policy to the certificate
    try {
      await this.iot.attachPrincipalPolicyAsync({ policyName: policyName, principal: certificateArn })
    } catch(e) {
      //Ignore if the policy already exists
      if (!e.code || e.code !== 'ResourceAlreadyExistsException') {
        e.status = 500
        throw e
      }
    }

    if (type === 'test') {
      try {
        await this.iot.attachThingPrincipalAsync({
          thingName: 'testEnv',
          principal: certificateArn
        })
      } catch (e) {
        if (!e.code || e.code !== 'ResourceAlreadyExistsException') {
          e.status = 500
          throw e
        }
      }
    }

    // Get infomation in x509 pem
    let certInfo = x509.Certificate.fromPEM(certificatePem)
    let keyId = certInfo.subjectKeyIdentifier
    let authkeyId = certInfo.authorityKeyIdentifier

    let sub_o = certInfo.subject.organizationName || null
    let sub_cn = certInfo.subject.commonName || null
    let iss_o = certInfo.issuer.organizationName || null
    let iss_cn = certInfo.issuer.commonName || null
    let iss_ou = certInfo.issuer.organizationalUnitName || null
    
    let certSN = certInfo.serialNumber
    let connect = await this.pool.getConnectionAsync()
    Promise.promisifyAll(connect)

    await connect.beginTransactionAsync()
    try {
      // insert device info into device table
      await connect.queryAsync('INSERT INTO device (sn, certId, keyId) VALUES (?,?,?)',
        [sn, certificateId, keyId])

      // insert certInfo into deviceCert
      await connect.queryAsync('INSERT INTO deviceCert (keyId, sub_o, sub_cn, iss_o, iss_cn, iss_ou, authkeyId, certSn) VALUES (?,?,?,?,?,?,?,?)',
        [keyId, sub_o, sub_cn, iss_o, iss_cn, iss_ou, authkeyId, certSN])

      await connect.commitAsync()      
    } catch(e) {
      await connect.rollbackAsync()
      throw e
    }
    connect.release()

    return {
      certPem: certificatePem,
      certId: certificateId,
      certArn: certificateArn
    }
  }

}

module.exports = AppService