const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'tradeshowdb'}\`;`);
  console.log('✅ Database checked/created');
  await connection.end();
}

setupDB().catch(console.error);
