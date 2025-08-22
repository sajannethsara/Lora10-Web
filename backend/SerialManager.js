import pkg from 'serialport'
import db from './db.js'
import { json } from 'express'

const { SerialPort, ReadlineParser } = pkg

let port = null
let parser = null
let serialConnected = false
let lastData = null
let currentSessionId = null

async function getCurrentSessionId() {
  try {
    const [rows] = await db.promise().query(
      'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
    );

    if (rows.length > 0) {
      currentSessionId = rows[0].sid;
      // console.log('[DB + Serial] Active session loaded. SID =', currentSessionId);
    } else {
      // console.error('[DB + Serial] No session found. Please insert at least one session.');
    }
  } catch (err) {
    console.error('[DB + Serial] Failed to load session:', err.message);
  }
}

const SERIAL_PATH = 'COM5' // <- Update to match your ESP32 port
const BAUD_RATE = 115200

function setupParser() {
  parser = port
  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))


  parser.on('data', async (line) => {
    console.log('[Serial] Received:', line);

    try {
      const payloadObject = JSON.parse(line);
      lastData = payloadObject;

      if (!currentSessionId) {
        console.warn('[DB] No active session. Skipping insert.');
        return;
      }


      // Step 1: Extract uid from payload
      const { uid } = payloadObject;
      if (!uid) {
        console.warn('[Payload] uid not found in payload. Skipping user check.');
        return;
      }

      // Step 2: Check if user exists
      const [userRows] = await db.promise().query(
        'SELECT * FROM user WHERE uid = ? AND sid = ?',
        [uid, currentSessionId]
      );


      // Step 3: Insert user if not found
      if (userRows.length === 0) {
        await db.promise().query(
          'INSERT INTO user (uid, uname, sid) VALUES (?, ?, ?)',
          [uid, `User-${uid}`, currentSessionId]
        );
        console.log(`[DB] New user inserted: User-${uid}`);
      } else {
        console.log(`[DB] User ${uid} already exists.`);
      }

      // Step 4: Insert into payload table
      const [payloadResult] = await db.promise().query(
        'INSERT INTO payload (payload_data, sid) VALUES (?, ?)',
        [JSON.stringify(payloadObject), currentSessionId]
      );
      const pid = payloadResult.insertId;


      console.log(`[DB] Payload inserted with ID: ${payloadResult.insertId}`);
      const type = payloadObject.data?.type;

      const currentTime = new Date();
      const direction = payloadObject.dir ?? 0;

      if (type === 0) {

        // ✅ Predefined message
        const pmsgid = payloadObject.data?.pmsgid ?? null;
        // Define your predefined messages in an array
        const predefinedMessages = [
          "Reached checkpoint",        // 0
          "started hike",              // 1
          "Taking a break",            // 2
          "low battery",               // 3
          "need help",                 // 4
          "Lost, need directions",     // 5
          "injured, need assistance",  // 6
          "returning to base",         // 7
          "reached destination",       // 8
          "wild animal sighted",       // 9
          "rain started",              // 10
          "too dark to proceed",       // 11
          "all good",                  // 12
          "slow progress",             // 13
          "no GPS signal"              // 14
        ];

        // Get message from array
        let msg = predefinedMessages[pmsgid] ?? null;

        if (!msg) {
          console.warn(`[DB] Unknown predefined message ID: ${pmsgid}`);
        }


        if (direction === 1) {
          await db.promise().query(
            'INSERT INTO u2b (uid, sid, pid, message, currentTime,type) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, currentSessionId, pid, msg, currentTime, 'predefined']
          );
          console.log(`[DB] Inserted predefined msg into u2b (uid=${uid})`);
        } else {
          await db.promise().query(
            'INSERT INTO b2u (uid, sid, pid, message, currentTime,type) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, currentSessionId, pid, msg, currentTime, 'predefined']
          );
          console.log(`[DB] Inserted predefined msg into b2u (uid=${uid})`);
        }
      } else if (type === 1) {

        // ✅ Custom message
        const cmsg = payloadObject.data?.cmsg ?? '';

        if (direction === 1) {
          await db.promise().query(
            'INSERT INTO u2b (uid, sid, pid, message, currentTime,type) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, currentSessionId, pid, cmsg, currentTime, 'custom']
          );
          console.log(`[DB] Inserted custom msg into u2b (uid=${uid})`);
        } else {
          await db.promise().query(
            'INSERT INTO b2u (uid, sid, pid, message, currentTime,type) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, currentSessionId, pid, cmsg, currentTime, 'custom']
          );
          console.log(`[DB] Inserted custom msg into b2u (uid=${uid})`);
        }
      } else if (type === 2) {
        // ✅ GPS data
        const lat = payloadObject.data?.lat ?? null;
        const lng = payloadObject.data?.lon ?? null;

        await db.promise().query(
          'INSERT INTO gps (uid, sid, pid, lat, lng, currentTime) VALUES (?, ?, ?, ?, ?, ?)',
          [uid, currentSessionId, pid, lat, lng, currentTime]
        );
        console.log(`[DB] Inserted GPS into gps for uid: ${uid}`);
      } else {
        console.warn(`[DB] Unknown type code: ${type}`);
      }
    } catch (err) {
      console.error('[Serial] Parse error:', err.message);
    }
  });
}


/*if (type === 0) {
 // Predefined message
 const pmsgid = data?.pmsgid ?? null
 const direction = payloadObject.dir // determine if it's u2b or b2u
 const msg = `Predefined-${pmsgid}`

 if (direction === 1) {
   await db.promise().query(
     'INSERT INTO u2b (uid, sid, pid, message, currentTime) VALUES (?, ?, ?, ?, ?)',
     [uid, currentSessionId, pid, msg, currentTime]
   )
   console.log(`[DB] Inserted predefined msg into u2b (uid=${uid})`)
 } else {
   await db.promise().query(
     'INSERT INTO b2u (uid, sid, pid, message, currentTime) VALUES (?, ?, ?, ?, ?)',
     [uid, currentSessionId, pid, msg, currentTime]
   )
   console.log(`[DB] Inserted predefined msg into b2u (uid=${uid})`)
 }

 
} else if (type === 1) {
 // Custom message
 const cmsg = data?.cmsg ?? ''
 const direction = payloadObject.dir

 if (direction === 1) {
   await db.promise().query(
     'INSERT INTO u2b (uid, sid, pid, message, currentTime) VALUES (?, ?, ?, ?, ?)',
     [uid, currentSessionId, pid, cmsg, currentTime]
   )
   console.log(`[DB] Inserted custom msg into u2b (uid=${uid})`)
 } else {
   await db.promise().query(
     'INSERT INTO b2u (uid, sid, pid, message, currentTime) VALUES (?, ?, ?, ?, ?)',
     [uid, currentSessionId, pid, cmsg, currentTime]
   )
   console.log(`[DB] Inserted custom msg into b2u (uid=${uid})`)
 }

} else if (type === 2) {
const lat = payloadObject.data?.lat || null;
const lng = payloadObject.data?.lon || null;  // <- it's `lon` in your JSON
await db.promise().query(
'INSERT INTO gps (uid, sid, pid, lat, lng, currentTime) VALUES (?, ?, ?, ?, ?, ?)',
[uid, currentSessionId, pid, lat, lng, currentTime]
);
console.log(`[DB] Inserted GPS into gps for uid: ${uid}`);
} else {
console.warn(`[DB] Unknown type code: ${type}`);
}

} catch (err) {
console.error('[Serial] Parse error:', err.message);
}
});

}*/

function tryConnect() {
  getCurrentSessionId()
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
  message = JSON.stringify(message);
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

