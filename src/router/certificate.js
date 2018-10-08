const Router = require('express').Router
const x509 = require('@fidm/x509')
const util = require('util')

const devicePolicy = require('../service/devicePolicy')

const f = af => (req, res, next) => af(req, res).then(x => x, next)

module.exports = (Iot) => {
  const router = Router()
  /**
   * @param id - key id / certId ?
   */
  router.get('/:id', (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.error(err)
      conn.query(`select * from device where keyId = ${ req.params.id }`, (err, results) => {
        if (err) return res.error(err)
        if (!results.length) return res.error(Object.assign(new Error('not found'), { status: 404 }))
        return res.success(results[0])
      })
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
    let { sn, reversion, csr, type } = req.body

    let data = await Iot.createCertificateFromCsrAsync({
      certificateSigningRequest: csr,
      setAsActive: true 
    })
    
    let certificateId = data.certificateId
    let certificatePem = data.certificatePem
    let certificateArn = data.certificateArn

    // create policy
    let policyName = 'Policy_Device_Iot'
    try {
      await Iot.createPolicyAsync({ policyDocument: JSON.stringify(devicePolicy), policyName: policyName })
    } catch(e) {
      //Ignore if the policy already exists
      if (!e.code || e.code !== 'ResourceAlreadyExistsException') {
        e.status = 500
        throw e
      }
    }

    // Attach the policy to the certificate
    try {
      await Iot.attachPrincipalPolicyAsync({ policyName: policyName, principal: certificateArn })
    } catch(e) {
      //Ignore if the policy already exists
      if (!e.code || e.code !== 'ResourceAlreadyExistsException') {
        throw e
      }
    }

    // Get infomation in x509 pem
    let certInfo = x509.Certificate.fromPEM(certificatePem)
    let keyId = certInfo.subjectKeyIdentifier
    let authkeyId = certInfo.authorityKeyIdentifier

    let sub_o = certInfo.subject.organizationName
    let sub_cn = certInfo.subject.commonName
    let iss_o = certInfo.issuer.organizationName
    let iss_cn = certInfo.issuer.commonName
    let iss_ou = certInfo.issuer.organizationalUnitName
    
    let certSN = certInfo.serialNumber
    let connect = await req.getConnectionAsync()
    let queryAsync = util.promisify(connect.query).bind(connect)
    
    // insert certInfo into deviceCert
    await queryAsync('INSERT INTO deviceCert (keyId, sub_o, sub_cn, iss_o, iss_cn, iss_ou, authkeyId, certSn) VALUES (?,?,?,?,?,?,?,?)',
      [keyId, sub_o, sub_cn, iss_o, iss_cn, iss_ou, authkeyId, certSN])
    
    // insert device info into device table
    await queryAsync('INSERT INTO device (sn, certId, keyId, type) VALUES (?,?,?,?)',
      [sn, certificateId, keyId, type])
    
    //TODO: insert into deviceCipe
    res.success({
      certPem: certificatePem,
      certId: certificateId
    })
  }))
  return router
}