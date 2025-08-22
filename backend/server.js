import express from 'express';
import cors from 'cors';
import db from './db.js';
import { getSerialStatus, sendToESP32 } from './SerialManager.js';
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

/* ------------------------- STATUS ROUTE ------------------------- */
app.get('/status', (req, res) => {
  try {
    const isSerialConnected = getSerialStatus();
    res.json({ isSerialConnected });
  } catch (err) {
    console.error('❌ Error fetching status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------- SESSION ROUTES ------------------------- */
app.get("/sessions", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT sid FROM session ORDER BY sid ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching sessions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/sessions', async (req, res) => {
  try {
    const [result] = await db.promise().query(
      "INSERT INTO session (dos, status) VALUES (NOW(), 'active')"
    );
    res.status(201).json({ sid: result.insertId });
  } catch (error) {
    console.error("❌ Error adding session:", error);
    res.status(500).json({ error: "Failed to add session" });
  }
});

app.get("/api/session/latest", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT sid FROM session ORDER BY sid DESC LIMIT 1"
    );
    if (rows.length === 0) return res.status(404).json({ error: "No sessions found" });
    res.json({ sid: rows[0].sid });
  } catch (error) {
    console.error("❌ Error fetching latest session ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------------- USER & DATA ROUTE ------------------------- */
app.get('/data', async (req, res) => {
  const inputSid = req.query.sid ? parseInt(req.query.sid) : null;
  // console.log("📥 Fetching data for session ID:", inputSid);

  try {
    let latestSid = inputSid;
    if (!latestSid || latestSid === 0) {
      const [rows] = await db.promise().query(
        'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
      );
      if (rows.length > 0) latestSid = rows[0].sid;
      else {
        console.error('[/Data] No session found.');
        return res.json([]);
      }
    }

    const [userIds] = await db.promise().query(
      'SELECT DISTINCT uid FROM user WHERE sid = ?',
      [latestSid]
    );
    if (userIds.length === 0) return res.json([]);

    const userData = await Promise.all(
      userIds.map(async ({ uid }) => {
        const [[userRow]] = await db.promise().query(
          'SELECT uname FROM user WHERE uid = ? AND sid = ?',
          [uid, latestSid]
        );
        const usernameSafe = userRow?.uname || 'Unknown';

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
          userId: `${uid}`,
          username: usernameSafe,
          gps: gps.map(g => ({ lat: g.lat, lng: g.lng, timestamp: toTimestamp(g.time) })),
          u2b: u2b.map(m => ({ text: m.text, timestamp: toTimestamp(m.time) })),
          b2u: b2u.map(m => ({ text: m.text, timestamp: toTimestamp(m.time) })),
        };
      })
    );

    res.json(userData);
    // console.log('📤 Data sent successfully for SID:', latestSid);
  } catch (err) {
    console.error('❌ Error in /data route:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------- CHAT ROUTES ------------------------- */
app.get('/chat/:uid/:sid', async (req, res) => {
  const { uid, sid } = req.params;
  let latestSid = sid;
  try {
    if (!latestSid || latestSid == 0) {
      const [rows] = await db.promise().query(
        'SELECT sid FROM session ORDER BY sid DESC LIMIT 1'
      );
      if (rows.length > 0) latestSid = rows[0].sid;
      else return res.json([]);
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

    const messages = rows.map(m => ({
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

app.post('/b2u', async (req, res) => {
  const { uid, sid, message, type, pmsgId } = req.body;
  const pid = null;

  try {
    await db.promise().query(
      'INSERT INTO b2u (uid, currentTime, type, message, pid, sid) VALUES (?, NOW(), ?, ?, ?, ?)',
      [uid, type, message, pid, sid]
    );

    if (type === 'predefined') sendToESP32({ userId: parseInt(uid), type: 'pmsg', data: pmsgId });
    else if (type === 'custom') sendToESP32({ userId: parseInt(uid), type: 'cmsg', data: message });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error inserting into b2u:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/user/rename", async (req, res) => {
  const { userId, newUsername, sid } = req.body;
  if (!userId || !newUsername?.trim() || !sid) {
    return res.status(400).json({ success: false, error: "User ID, session ID and new username are required" });
  }

  try {
    const [result] = await db.promise().query(
      "UPDATE user SET uname = ? WHERE uid = ? AND sid = ?",
      [newUsername.trim(), userId, sid]
    );

    if (result.affectedRows > 0) res.json({ success: true });
    else res.json({ success: false, error: "User not found for this session" });
  } catch (err) {
    console.error("❌ Error renaming user:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post('/send', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  sendToESP32(message);
  res.json({ success: true, sent: message });
});

/* ------------------------- SOCKET.IO SETUP ------------------------- */
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("✅ Frontend connected:", socket.id);
});

// Polling DB for new u2b rows
let lastId = 0;
setInterval(async () => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM u2b ORDER BY u2bid DESC LIMIT 1"
    );
    if (rows.length > 0) {
      const latest = rows[0];
      if (latest.u2bid > lastId) {
        lastId = latest.u2bid;
        io.emit("newU2BMessage", latest);
        console.log("📢 Sent notification for new U2B row:", latest);
      }
    }
  } catch (err) {
    console.error("❌ Error checking u2b:", err);
  }
}, 2000);

httpServer.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
