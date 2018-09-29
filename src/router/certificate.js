const Router = require('express').Router
const x509 = require('@fidm/x509')
const util = require('util')

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
  router.post('/sign', f(async (req, res) => {

    let { sn, csr, type } = req.body

    let data = await Iot.createCertificateFromCsrAsync({
      certificateSigningRequest: req.body.csr,
      setAsActive: true 
    })
    
    let certificateId = data.certificateId
    let certificatePem = data.certificatePem
    let certInfo = x509.Certificate.fromPEM(certificatePem)
    let keyId = certInfo.subjectKeyIdentifier
    let signerKeyId = certInfo.authorityKeyIdentifier
    let { commonName, countryName, localityName, stateOrProvinceName, 
      organizationName, organizationalUnitName, emailAddress
    } = certInfo.subject

    let connect = await req.getConnectionAsync()
    let queryAsync = util.promisify(connect.query).bind(connect)
    await queryAsync()
    // res.success()

  }))
  return router
}