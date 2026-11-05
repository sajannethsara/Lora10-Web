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

export const pmsgListForUser = [
  "Okay",                     // 0
  "Yes",                      // 1
  "No",                       // 2
  "Need help",                // 3
  "All good",                 // 4
  "No GPS signal",            // 5
  "Reached checkpoint",       // 6
  "Started hike",             // 7
  "Taking a break",           // 8
  "Low battery",              // 9
  "Lost, need directions",    // 10
  "Injured, need assistance", // 11
  "Returning to base",        // 12
  "Reached destination",      // 13
  "Wild animal sighted",      // 14
  "Rain started",             // 15
  "Too dark to proceed",      // 16
  "Slow progress",            // 17
];

export const pmsgListForBase = [
  "Do you need help?",                  // 0
  "Come to base now!",                  // 1
  "Take a break",                       // 2
  "Please respond ASAP.",               // 3
  "Turn right, water is available.",    // 4
  "Turn left, water is available.",     // 5
  "Move forward, water is available.",  // 6
  "Move backward, water is available.", // 7
  "Campsite Nearby",                    // 8
  "Turn on your device",                // 9
  "Remain at current location",         // 10
  "First aid arriving",                 // 11
  "Leave area immediately",             // 12
  "Seek shelter quickly"                // 13
];

const SERIAL_PATH = 'COM11' // <- Update to match your ESP32 port
const BAUD_RATE = 115200

function setupParser() {
  parser = port
  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))


  parser.on('data', async (line) => {
    const trimmedLine = line.trim()
    console.log('[Serial] Received:', trimmedLine)

    if (!trimmedLine.startsWith('{')) {
      return
    }

    try {
      const payloadObject = JSON.parse(trimmedLine);
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
        const isUserToBase = direction === 1;

        // Use pmsgListForUser when dir=1 (U2B), pmsgListForBase when dir=0 (B2U)
        const msgList = isUserToBase ? pmsgListForUser : pmsgListForBase;
        let msg = pmsgid !== null && pmsgid !== undefined ? msgList[pmsgid] ?? null : null;

        if (!msg) {
          console.warn(`[DB] Unknown predefined message ID: ${pmsgid} (dir=${direction})`);
          msg = `Predefined-${pmsgid}`;
        }

        if (isUserToBase) {
          await db.promise().query(
            'INSERT INTO u2b (uid, sid, pid, message, currentTime, type) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, currentSessionId, pid, msg, currentTime, 'predefined']
          );
          console.log(`[DB] Inserted predefined msg into u2b (uid=${uid}): "${msg}"`);
        } else {
          await db.promise().query(
            'INSERT INTO b2u (uid, sid, pid, message, currentTime, type) VALUES (?, ?, ?, ?, ?, ?)',
            [uid, currentSessionId, pid, msg, currentTime, 'predefined']
          );
          console.log(`[DB] Inserted predefined msg into b2u (uid=${uid}): "${msg}"`);
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

