import express from 'express'
import cors from 'cors'
import db from './db.js'
import { getSerialStatus, getLastESPData, sendToESP32 } from './SerialManager.js'

const app = express()

const port = 3000

app.use(cors())
app.use(express.json())
// console.log(getSerialStatus())

app.get('/status', (req, res) => {
  try{
    const isSerialConnected = getSerialStatus()

    res.json({
      isSerialConnected
    })
  } catch (err) {
    console.error('❌ Error fetching status:', err) }
})

app.get('/data', async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT * FROM user')

    const userData = await Promise.all(users.map(async (user) => {
      const [gps] = await db.promise().query(
        'SELECT lat, lng, currentTime AS timestamp FROM gps WHERE uid = ?',
        [user.uid]
      )
      const [u2b] = await db.promise().query(
        'SELECT message AS text, currentTime AS timestamp FROM u2b WHERE uid = ?',
        [user.uid]
      )
      const [b2u] = await db.promise().query(
        'SELECT message AS text, currentTime AS timestamp FROM b2u WHERE uid = ?',
        [user.uid]
      )

      return {
        uid: user.uid,
        uname: user.uname,
        gps,
        u2b,
        b2u
      }
    }))

    res.json(userData)
  } catch (err) {
    console.error('❌ Error fetching data:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})



// ... other routes

// ✉️ Add this BEFORE app.listen()
app.post('/send', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  sendToESP32(message);
  res.json({ success: true, sent: message });
});


app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`)
})
