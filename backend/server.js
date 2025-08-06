import express from 'express';
import cors from 'cors';
import db from './db.js';
import { getSerialStatus, getLastESPData, sendToESP32 } from './SerialManager.js';

const app = express();
const port = 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

/* -------------------------------------------------------------------------- */
/*                                STATUS ROUTE                                */
/* -------------------------------------------------------------------------- */

// ✅ ESP32 Serial Connection Status
app.get('/status', (req, res) => {
  try {
    const isSerialConnected = getSerialStatus();
    res.json({ isSerialConnected });
  } catch (err) {
    console.error('❌ Error fetching status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ✅ Get all session IDs
app.get("/sessions", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT sid FROM session ORDER BY sid ASC"
    );

    // Send array like: [ { sid: 1 }, { sid: 2 }, ... ]
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching all sessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// ✅ Add new session
app.post('/sessions', async (req, res) => {
  try {
    const [result] = await db.promise().query(
      "INSERT INTO session (dos, status) VALUES (NOW(), 'active')"
    );

    const newSid = result.insertId;
    res.status(201).json({ sid: newSid });
  } catch (error) {
    console.error("❌ Error adding new session:", error);
    res.status(500).json({ error: "Failed to add session" });
  }
});



/* -------------------------------------------------------------------------- */
/*                            FETCH SESSION & USER DATA                       */
/* -------------------------------------------------------------------------- */

// ✅ Fetch all user-related data for the latest session
app.get('/data', async (req, res) => {
  const inputSid = req.query.sid != null ? parseInt(req.query.sid) : null;
  console.log("📥 Fetching data for session ID:", inputSid);
  try {
    let latestSid = inputSid;
    if (inputSid == null || inputSid === 0) {
      const [rows] = await db.promise().query(
        'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
      );
      if (rows.length > 0) {
        latestSid = rows[0].sid;
        console.log('[/Data--] Active session loaded. SID =', latestSid);
      } else {
        console.error('[/Data] No session found. Please insert at least one session.');
        return res.json([]);
      }
    }
    console.log("📥 Changed session ID:", latestSid);
    if (!latestSid) return res.json([]);

    const [userIds] = await db.promise().query(
      'SELECT DISTINCT uid FROM user WHERE sid = ?',
      [latestSid]
    );

    if (userIds.length === 0) return res.json([]);

    const userData = await Promise.all(
      userIds.map(async ({ uid }) => {
        const [[user]] = await db.promise().query(
          'SELECT * FROM user WHERE uid = ?',
          [uid]
        );

        const [gps] = await db.promise().query(
          'SELECT lat, lng, currentTime AS time FROM gps WHERE uid = ? AND sid = ?',
          [uid, latestSid]
        );

        const [u2b] = await db.promise().query(
          'SELECT message AS text, currentTime AS time FROM u2b WHERE uid = ? AND sid = ?',
          [uid, latestSid]
        );

        const [b2u] = await db.promise().query(
          'SELECT message AS text, currentTime AS time FROM b2u WHERE uid = ? AND sid = ?',
          [uid, latestSid]
        );

        const toTimestamp = (t) => t ? new Date(t).getTime() : Date.now();

        return {
          userId: `${user.uid}`,
          username: user.uname || `User ${user.uid}`,
          gps: gps.map((g) => ({
            lat: g.lat,
            lng: g.lng,
            timestamp: toTimestamp(g.time),
          })),
          u2b: u2b.map((m) => ({
            text: m.text,
            timestamp: toTimestamp(m.time),
          })),
          b2u: b2u.map((m) => ({
            text: m.text,
            timestamp: toTimestamp(m.time),
          })),
        };
      })
    );

    res.json(userData);
    console.log('📤 Data sent successfully:' + latestSid);
  } catch (err) {
    console.error('❌ Error fetching filtered session data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Get latest session ID
app.get("/api/session/latest", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT sid FROM session ORDER BY sid DESC LIMIT 1"
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "No sessions found" });
    }
    res.json({ sid: rows[0].sid });
  } catch (error) {
    console.error("❌ Error fetching latest session ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                CHAT ROUTES                                 */
/* -------------------------------------------------------------------------- */

// ✅ Fetch merged chat (u2b + b2u) messages by UID
app.get('/chat/:uid/:sid', async (req, res) => {
  const uid = req.params.uid;
  const inputSid = req.params.sid;
  let latestSid = inputSid;
  // let latestSid = inputSid;
  // if (inputSid == null || inputSid === 0) {
  //   const [rows] = await db.promise().query(
  //     'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
  //   );
  //   if (rows.length > 0) {
  //     latestSid = rows[0].sid;
  //     console.log('[/Data--] Active session loaded. SID =', latestSid);
  //   } else {
  //     console.error('[/Data] No session found. Please insert at least one session.');
  //     return res.json([]);
  //   }
  // }
  console.log("📥--------------------- Fetching chat for UID:", uid, "SID:", inputSid);
  try {
    latestSid = inputSid;
    if (inputSid == null || inputSid == 0) {
      const [rows] = await db.promise().query(
        'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
      );
      if (rows.length > 0) {
        latestSid = rows[0].sid;
        // console.log('[/Data--] Active session loaded. SID =', latestSid);
        console.log("📥------Changed--------------- Fetching chat for UID:", uid, "SID:", latestSid);

      } else {
        console.error('[/Data] No session found. Please insert at least one session.');
        return res.json([]);
      }
    }
    const [rows] = await db.promise().query(
      `
      SELECT message, currentTime AS time, 'u2b' AS sender FROM u2b WHERE uid = ? AND sid = ?
      UNION
      SELECT message, currentTime AS time, 'b2u' AS sender FROM b2u WHERE uid = ? AND sid = ?
      ORDER BY time ASC
      `,
      [uid, latestSid, uid, latestSid]
    );

    const messages = rows.map((m) => ({
      text: m.message,
      timestamp: m.time,
      sender: m.sender
    }));

    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching chat:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});
/*app.get('/chat/:uid', async (req, res) => {
  const uid = req.params.uid;
  const sid = req.query.sid ? parseInt(req.query.sid) : null;

  if (!sid) {
    return res.status(400).json({ error: 'Session ID (sid) query parameter is required' });
  }

  try {
    const [rows] = await db.promise().query(
      `
      SELECT message, currentTime AS time, 'u2b' AS sender FROM u2b WHERE uid = ? AND sid = ?
      UNION
      SELECT message, currentTime AS time, 'b2u' AS sender FROM b2u WHERE uid = ? AND sid = ?
      ORDER BY time ASC
      `,
      [uid, sid, uid, sid]
    );

    const messages = rows.map((m) => ({
      text: m.message,
      timestamp: m.time,
      sender: m.sender
    }));

    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching chat:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});*/


// ✅ Insert message into b2u table
app.post('/b2u', async (req, res) => {
  const { uid, sid, message, type, pmsgId } = req.body;
  const pid = null; // use null by default

  console.log("📥 Incoming message to insert:", { uid, sid, message, type, pid });

  try {
    const [result] = await db.promise().query(
      'INSERT INTO b2u (uid, currentTime, type, message, pid, sid) VALUES (?, NOW(), ?, ?, ?, ?)',
      [uid, type, message, pid, sid]
    );

    console.log("✅ Insert successful:", result);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error inserting into b2u:", error.message, error);
    res.status(500).json({ success: false, error: error.message });
  }
// {"userId": 77,"type": "pmsg","data": 12}
// {"userId": 77,"type": "cmsg","data": "Hi man raju"}
  if(type === 'predefined') {
    console.log("📥 Predefined message detected, sending to ESP32...");
    sendToESP32({userId:uid,type: 'pmsg', data: pmsgId});
  }
  else if (type === 'custom') {
    sendToESP32({userId:uid,type: 'cmsg', data: message});
    console.log("📥 Custom message detected, sending to ESP32...");
  }
});

/* -------------------------------------------------------------------------- */
/*                             ESP32 Message Route                            */
/* -------------------------------------------------------------------------- */

// ✅ Send message to ESP32 via Serial
app.post('/send', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  sendToESP32(message);
  res.json({ success: true, sent: message });
});

/* -------------------------------------------------------------------------- */
/*                                START SERVER                                */
/* -------------------------------------------------------------------------- */

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});