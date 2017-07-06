const logger = require('./logger')
const GoogleSpreadsheet = require('google-spreadsheet')
const Excel = require('exceljs')

class GoogleSheet {

  constructor () {
    this.doc = null
    this.info = null
    this.offline = false
  }

  init (sheed_id = null) {
    if (sheed_id == null)
      return this.initOffline()

    this.doc = new GoogleSpreadsheet(sheed_id)
    
    return this.setAuth()
      .then(() => {
        return this.loadSheets()
      })
      .catch(err => logger.error('-- Google Sheets: error,', err))
  }

  initOffline () {
    this.offline = true

    return new Promise((resolve, reject) => {
      let workbook = new Excel.Workbook()
      workbook.csv.readFile('data.ods')
        .then(worksheet => {
          this.info = workbook
          resolve()
        })
        .catch(err => reject(err))
    })
  }

  setAuth () {
    return new Promise((resolve, reject) => {
      const creds = require('../client_secret.json')

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

  getSheetOffline (name) {
    return new Promise((resolve, reject) => {
      let sheet = this.info.getWorksheet(name)
      if (sheet)
        resolve(sheet)

      /* Sheet not found, create it */
      sheet = this.info.addWorksheet(name)
      sheet.columns = [
        { header: 'Timestamp', key: 'timestamp' },
        { header: 'Position', key: 'position' },
        { header: 'LSNR', key: 'lsnr' },
        { header: 'RSSI', key: 'rssi' },
      ]
      resolve(sheet)
    })
  }

  add (rowData) {
    if (this.offline == false) {
      this.addRow(rowData)
    } else {
      this.addRowOffline(rowData)
    }
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

  addRowOffline ({pos, timestamp, latlng, lsnr, rssi}) {
    this.getSheetOffline(latlng).then(sheet => {
      sheet.addRow({
        timestamp: timestamp,
        position: pos,
        lsnr: lsnr,
        rssi: rssi
      })
      this.info.csv.writeFile('data.ods')
        .catch( err => {
          logger.error('-- Sheets: error,', err)
        })
    })
  }
}

module.exports = new GoogleSheet
