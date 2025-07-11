import pkg from 'serialport'
import db from './db.js'

const { SerialPort, ReadlineParser } = pkg

let port = null
let parser = null
let serialConnected = false
let lastData = null

const SERIAL_PATH = 'COM4' // <- Update to match your ESP32 port
const BAUD_RATE = 115200

function setupParser() {
  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

  parser.on('data', async (line) => {
    console.log('[Serial] Received:', line)

    try {
      const parsed = JSON.parse(line)
      lastData = parsed

      const { userId, gps } = parsed
      if (gps && userId ) {
        let currentTime = new Date()
        await db.promise().query(
          'INSERT INTO gps (userId, lat, lng, currentTime) VALUES (?, ?, ?, ?)',
          [userId, gps.lat, gps.lng, currentTime]
        )
      }

    } catch (err) {
      console.error('[Serial] Parse error:', err.message)
    }
  })
}

function tryConnect() {
  if (serialConnected || (port && port.isOpen)) return

  port = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD_RATE, autoOpen: false })

  port.open((err) => {
    if (err) {
      console.log('[Serial] Not connected. Retrying...')
      serialConnected = false
      return
    }

    console.log('[Serial] Connected to ESP32 on', SERIAL_PATH)
    serialConnected = true
    setupParser()
  })

  port.on('close', () => {
    console.log('[Serial] Port closed')
    serialConnected = false
  })

  port.on('error', (err) => {
    console.error('[Serial] Serial error:', err.message)
    serialConnected = false
  })
}

// Retry every 3 seconds
setInterval(() => {
  if (!serialConnected) {
    tryConnect()
  }
}, 3000)

export function getSerialStatus() {
  return serialConnected
}

export function getLastESPData() {
  return lastData
}



export function sendToESP32(message) {
  if (port && port.isOpen) {
    port.write(message + '\n', (err) => {
      if (err) {
        console.error('[Serial] Failed to send:', err.message)
      } else {
        console.log('[Serial] Sent to ESP32:', message)
      }
    })
  } else {
    console.warn('[Serial] Cannot send, serial port not open')
  }
}

