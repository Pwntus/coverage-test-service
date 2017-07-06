const logger = require('./logger')
const GoogleSpreadsheet = require('google-spreadsheet')
const creds = require('../client_secret.json')

class GoogleSheet {

  constructor () {
    this.doc = null
    this.info = null
  }

  init (sheed_id) {
    this.doc = new GoogleSpreadsheet(sheed_id)
    
    return this.setAuth()
      .then(() => {
        return this.loadSheets()
      })
      .catch(err => logger.error('-- Google Sheets: error,', err))
  }

  setAuth () {
    return new Promise((resolve, reject) => {

      this.doc.useServiceAccountAuth(creds, (err) => {
        if (err)
          reject(err)

        resolve()
      })
    })
  }

  loadSheets () {
    return new Promise((resolve, reject) => {
      this.doc.getInfo((err, info) => {
        if (err)
          reject(err)

        this.info = info
        resolve()
      })
    })
  }

  getSheet (name) {
    return new Promise((resolve, reject) => {
      for (let i in this.info.worksheets) {
        if (name == this.info.worksheets[i].title) {
          resolve(this.info.worksheets[i])
        }
      }

      /* Sheet not found, create it */
      this.doc.addWorksheet({
        title: name,
        headers: [
          'Timestamp',
          'Position',
          'LSNR',
          'RSSI'
        ]
      }, (err, sheet) => {
        if (err)
          reject(err)

        resolve(sheet)
      })
    })
  }

  addRow({pos, timestamp, latlng, lsnr, rssi}) {
    this.getSheet(latlng).then(sheet => {
      sheet.addRow({
        'Timestamp': timestamp,
        'Position': pos,
        'LSNR': lsnr,
        'RSSI': rssi
      }, (err, row) => {
        if (err)
          logger.error('-- Google Sheets: error,', err)
      })
    })
    .catch(err => logger.error('-- Google Sheets: error,', err))
  }
}

module.exports = new GoogleSheet
