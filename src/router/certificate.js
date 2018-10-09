/*
 * Filename: /home/jackyang/factory/src/router/certificate.js
 * Path: /home/jackyang/factory
 * Created Date: Tuesday, October 9th 2018, 2:21:05 pm
 * Author: JackYang
 * 
 * Copyright (c) 2018 Wisnuc Inc
 */

const Router = require('express').Router

const f = af => (req, res, next) => af(req, res).then(x => x, next)

module.exports = (service) => {
  const router = Router()
  /**
   * @param id - key id / certId ?
   */
  router.get('/:keyId', (req, res) => {
    service.certByKeyId(req.params.keyId, (err, data) => {
      err ? res.error(err) : res.success(data)
    })
  })

  /**
    commonName = 'CN';
    countryName = 'C';
    localityName = 'L';
    stateOrProvinceName = 'ST';
    organizationName = 'O';
    organizationalUnitName = 'OU';
    emailAddress = 'E';
   */
  /**
   * 1. createCertificateFromCsrAsync
   * 2. set as active
   * 3. attach policy
   * 4. insert device table
   * 5. insert deviceCert table
   */
  router.post('/sign', f(async (req, res) => {
    /* eslint-disable */
    let data = await service.registByCsr(req.body)
    res.success(data)
  }))
  return router
}