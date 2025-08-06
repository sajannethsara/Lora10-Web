// db.js
import mysql from 'mysql2'

// Create the database connection
const connection = mysql.createConnection({
  host: 'localhost',         // Your DB host (usually localhost)
  user: 'root',              // Your MySQL username
  password: '2003', // Your MySQL password
  database: 'lora10'  // Name of the database you created
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
  
// import mysql from 'mysql2/promise';

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

