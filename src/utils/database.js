// src/utils/database.js
const { Pool } = require('pg');

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('Initializing database connection...');

let pool;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  // Test connection immediately
  pool.on('connect', () => {
    console.log('Database client connected');
  });

  pool.on('error', (err) => {
    console.error('Database pool error:', err);
  });

} catch (error) {
  console.error('Failed to create database pool:', error.message);
  process.exit(1);
}

const initializeDatabase = async () => {
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Database connected successfully');

    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', result.rows[0].version);

    // Create tables if they don't exist
    console.log('Creating/verifying tables...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        short_code VARCHAR(10) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        total_clicks INTEGER DEFAULT 0,
        last_clicked TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Links table created/verified');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_short_code ON links(short_code)
    `);
    console.log('Index created/verified');

    // Verify table creation
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'links'
    `);
    
    console.log('Table verification:', tables.rows.length > 0 ? 'SUCCESS' : 'FAILED');

    return true;

  } catch (error) {
    console.error('Database initialization failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('password')) {
      console.error('Password issue detected. Check your DATABASE_URL password.');
    }
    
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

const runQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows[0] || result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

const allQuery = async (query, params = []) => {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  initializeDatabase,
  runQuery,
  getQuery,
  allQuery,
  pool
};