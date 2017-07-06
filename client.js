#!/usr/bin/env node
console.log('\033[2J')

/* Input argv */
var argv = require('optimist')
  .demand('u').string('u')
  .demand('p').string('p')
  .demand('t').string('t')
  .string('s').default('s', null)
  .argv

/* Libs */
const ora = require('ora')
const logger = require('./lib/logger')
const MIC = require('./lib/MIC')
const GS = require('./lib/GoogleSheet')
const MQTT = require('./lib/MQTTClient')

/* Init CLI */
const spinner = ora('Initializing Cloud Connect...')
spinner.color = 'green'
spinner.start()

/* Init MIC, fetch manifest */
MIC.init().then(() => {
  /* Login using cmd parameters */
  MIC.login(argv.u, argv.p).then(() => {

    /* Init Google Sheets */
    spinner.text = 'Initializing Spreadsheet...'
    GS.init(argv.s).then(() => {

      /* Init MQTT client with AWS config */
      spinner.text = 'Initializing MQTT client...'
      MQTT.init(MIC.AWS.config)
      setupEvents()

    })
    .catch(error => {
      spinner.stop()
      logger.error('-- Sheets: error,', error)
    })
  })
  .catch(error => {
    spinner.stop()
    logger.error('-- MIC: error,', error)
  })
})
.catch(() => spinner.stop())

/* Setup event handlers */
const setupEvents = () => {
  MQTT.client.on('reconnect',  ()               => onReconnect())
  MQTT.client.on('connect',    ()               => onConnect())
  MQTT.client.on('message',    (topic, message) => onMessage(topic, message))
  MQTT.client.on('close',      ()               => logger.warn('-- MQTT: connection closed'))
  MQTT.client.on('error',      (e)              => logger.error('-- MQTT: error,', e))
}

/* On MQTT reconnect try to refresh AWS Cognito
 * credentials, update websocket credentials
 * and reconnect.
 */
const onReconnect = () => {
  logger.warn('-- MQTT: reconnect')

  MIC.refreshCredentials().then(() => {
    MQTT.client.end(true)
    MQTT.init(MIC.AWS.config)
    setupEvents()
  })
  .catch(err => {
    logger.error('-- onReconnect: catch,', err)
  })
}

/* On MQTT connection subscribe to configured topic.
 */
const onConnect = () => {
  spinner.stop()
  logger.info('-- MQTT: connected')
  logger.info('-- MQTT: subscribing to', argv.t)

  MQTT.client.subscribe(argv.t, {qos: 1}, (err, granted) => {
    if (err) logger.error('-- MQTT: error in message,', err)
  })

}

/* On MQTT message, parse the data and pass it to
 * the Google Sheet module.
 */
const onMessage = (topic, message) => {
  const data = JSON.parse(message)

  try {
    const { timestamp, pos, latlng, lsnr } = data.state.reported
    const rssi = data.state.reported.tcxn.cellular.rssi
    
    logger.info(`-- MQTT: got message, [${topic}]: ${pos}`)
    GS.add({pos, timestamp, latlng, lsnr, rssi})
  } catch (e) {
    logger.warn('-- MQTT: failed to parse message')
  }
}
