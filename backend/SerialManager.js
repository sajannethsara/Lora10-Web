import pkg from 'serialport'
import db from './db.js'

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
      console.log('[DB] Active session loaded. SID =', currentSessionId);
    } else {
      console.error('[DB] No session found. Please insert at least one session.');
    }
  } catch (err) {
    console.error('[DB] Failed to load session:', err.message);
  }
}

const SERIAL_PATH = 'COM4' // <- Update to match your ESP32 port
const BAUD_RATE = 115200

function setupParser() {
  parser = port
  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))

 /* parser.on('data', (line) => {
    // Convert received line (string) to Buffer of int8_t values
    const buffer = Buffer.from(line.trim().split(',').map(Number))
    console.log('[Serial] Received int8_t vector:', buffer)
    lastData = buffer
    console.log('[Serial] Last data updated:', lastData)
  })*/
  

 /* parser.on('data', async (line) => {
    console.log('[Serial] Received:', line)

    try {
      const payloadObject = JSON.parse(line)
      lastData = payloadObject
      // console.log('[JSon] Received:', payloadObject)
      // Insert into payload table
      const [payloadResult] = await db.promise().query(
        'INSERT INTO payload (payload_data, sid) VALUES (?, ?)',
        [JSON.stringify(payloadObject), currentSessionId]
      );
      console.log(payloadResult)
      // You should edit their
       

      


    } catch (err) {
      console.error('[Serial] Parse error:', err.message)
    }
  })*/
  parser.on('data', async (line) => {
  console.log('[Serial] Received:', line);

  try {
    const payloadObject = JSON.parse(line);
    lastData = payloadObject;

    // Step 1: Extract uid from payload
    const { uid } = payloadObject;
    if (!uid) {
      console.warn('[Payload] uid not found in payload. Skipping user check.');
      return;
    }

    // Step 2: Check if user exists
    const [userRows] = await db.promise().query(
      'SELECT * FROM user WHERE uid = ?',
      [uid]
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

    console.log(`[DB] Payload inserted with ID: ${payloadResult.insertId}`);
    const type = payloadObject.data?.type;

    const currentTime = new Date();

    /*if (type === 0) {
      const pmsgid = payloadObject.data?.pmsgid || null;
      await db.promise().query(
        'INSERT INTO u2b (uid, message, currentTime) VALUES (?, ?, ?)',
        [uid, `Predefined-${pmsgid}`, currentTime]
    );
    console.log(`[DB] Inserted predefined msg (pmsgid=${pmsgid}) into u2b for uid: ${uid}`);*/
       if (type === 0) {
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

   /*} else if (type === 1) {
     const cmsg = payloadObject.data?.cmsg || null;
     await db.promise().query(
       'INSERT INTO b2u (uid, message, currentTime) VALUES (?, ?, ?)',
       [uid, cmsg, currentTime]
     );
     console.log(`[DB] Inserted custom msg into b2u for uid: ${uid}`);*/
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

}

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

// import pkg from 'serialport';
// import db from './db.js';

// const { SerialPort, ReadlineParser } = pkg;

// let port = null;
// let parser = null;
// let serialConnected = false;
// let lastData = null;
// let currentSessionId = null;

// const SERIAL_PATH = 'COM5'; // Update for your ESP32 port
// const BAUD_RATE = 115200;

// // Load latest session ID from DB
// // async function import mysql from 'mysql2/promise';

// // Create a promise-based connection pool to your MySQL database
// const pool = mysql.createPool({
//   host: 'localhost',       // Your DB host
//   user: 'root',            // Your MySQL username
//   password: 'MNnf2687967@',// Your MySQL password
//   database: 'lora10',      // Your database name
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// export default pool;
//  {
//   try {
//     const [rows] = await db.promise().query(
//       'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
//     );

//     if (rows.length > 0) {
//       currentSessionId = rows[0].sid;
//       console.log('[DB] Active session loaded. SID =', currentSessionId);
//     } else {
//       console.error('[DB] No session found. Please insert at least one session.');
//     }
//   } catch (err) {
//     console.error('[DB] Failed to load session:', err.message);
//   }
// }

// function setupParser() {
//   parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

//   // First parser: int8_t binary buffer
//   parser.on('data', (line) => {
//     if (!line.includes('{')) {
//       const buffer = Buffer.from(line.trim().split(',').map(Number));
//       console.log('[Serial] Received int8_t vector:', buffer);
//       lastData = buffer;
//       return;
//     }
//   });

//   // Second parser: JSON data
//   parser.on('data', async (line) => {
//     if (!line.includes('{')) return;

//     console.log('[Serial] Received:', line);

//     try {
//       const payloadObject = JSON.parse(line.trim());
//       lastData = payloadObject;
//       console.log('[JSON] Received:', payloadObject);

//       if (!currentSessionId) {
//         console.warn('[DB] Session ID not set. Skipping insert.');
//         return;
//       }

//       const { uid, type, msgtype, message, gps } = payloadObject;
//       const currentTime = new Date();

//       if (!uid || !type) {
//         console.warn('[JSON] Invalid payload: missing uid or type');
//         return;
//       }

//       // Insert into payload table
//       const [payloadResult] = await db.promise().query(
//         'INSERT INTO payload (payload_data, sid) VALUES (?, ?)',
//         [JSON.stringify(payloadObject), currentSessionId]
//       );
//       const pid = payloadResult.insertId;

//       // Ensure user exists
//       await db.promise().query(
//         'INSERT IGNORE INTO user (uid, uname, sid) VALUES (?, ?, ?)',
//         [uid, `User-${uid}`, currentSessionId]
//       );

//       // Insert into correct table based on type
//       if (type === 'u2b') {
//         await db.promise().query(
//           'INSERT INTO u2b (uid, currentTime, type, message, pid, sid) VALUES (?, ?, ?, ?, ?, ?)',
//           [uid, currentTime, msgtype, message, pid, currentSessionId]
//         );
//       } else if (type === 'b2u') {
//         await db.promise().query(
//           'INSERT INTO b2u (uid, currentTime, type, message, pid, sid) VALUES (?, ?, ?, ?, ?, ?)',
//           [uid, currentTime, msgtype, message, pid, currentSessionId]
//         );
//       } else if (type === 'gps' && gps) {
//         await db.promise().query(
//           'INSERT INTO gps (uid, currentTime, lat, lng, pid, sid) VALUES (?, ?, ?, ?, ?, ?)',
//           [uid, currentTime, gps.lat, gps.lng, pid, currentSessionId]
//         );
//       } else {
//         console.warn('[DB] Unknown or unsupported type:', type);
//       }

//     } catch (err) {
//       console.error('[Serial] Parse error:', err.message);
//     }
//   });
// }

// function tryConnect() {
//   if (serialConnected || (port && port.isOpen)) return;

//   port = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD_RATE, autoOpen: false });

//   port.open((err) => {
//     if (err) {
//       console.log('[Serial] Not connected. Retrying...');
//       serialConnected = false;
//       return;
//     }

//     console.log('[Serial] Connected to ESP32 on', SERIAL_PATH);
//     serialConnected = true;
//     setupParser();
//   });

//   port.on('close', () => {
//     console.log('[Serial] Port closed');
//     serialConnected = false;
//   });

//   port.on('error', (err) => {
//     console.error('[Serial] Serial error:', err.message);
//     serialConnected = false;
//   });
// }

// // Retry connection every 3 seconds
// setInterval(() => {
//   if (!serialConnected) {
//     tryConnect();
//   }
// }, 3000);

// // Load session once on startup
// loadLatestSession();

// // Exported API
// export function getSerialStatus() {
//   return serialConnected;
// }

// export function getLastESPData() {
//   return lastData;
// }

// export function sendToESP32(message) {
//   if (port && port.isOpen) {
//     port.write(message + '\n', (err) => {
//       if (err) {
//         console.error('[Serial] Failed to send:', err.message);
//       } else {
//         console.log('[Serial] Sent to ESP32:', message);
//       }
//     });
//   } else {
//     console.warn('[Serial] Cannot send, serial port not open');
//   }
// }


