// db.js
import mysql from 'mysql2'

// Create the database connection
const connection = mysql.createConnection({
  host: 'localhost',         // Your DB host (usually localhost)
  user: 'root',              // Your MySQL username
  password: 'MNnf2687967@', // Your MySQL password
  database: 'lora'  // Name of the database you created
})

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack)
    return
  }
  console.log('✅ Connected to MySQL database.')
})

// Export the connection to use in other files
export default connection
