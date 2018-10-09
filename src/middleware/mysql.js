const mysql = require('mysql')
const config = require('../../config/config')

let pool = mysql.createPool({
  connectionLimit: 20,
  host: config.db.rds.host,
  user: config.db.rds.user,
  password: config.db.rds.password,
  database: config.db.rds.dbname
})

module.exports = (req, res, next) => {
  req.poolQuery = pool.query.bind(pool)
  req.getConnection = (callback) => {
    pool.getConnection((err, connection) => {
      if (err) return callback(err)
      req.connection = connection
      let preRelease = req.connection.release.bind(connection)
      req.connection.release = () => {
        if (req.connection)
          preRelease()
        req.connection = undefined
      }
      callback(null, connection)
    })
  }
  req.getConnectionAsync = async () => new Promise((resolve, reject) => {
    req.getConnection((err, conn) => err ? reject(err) : resolve(conn))
  })
  next()
}