const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.db');
const db = new sqlite3.Database(dbPath);

const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create links table
      db.run(`
        CREATE TABLE IF NOT EXISTS links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          short_code VARCHAR(10) UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          total_clicks INTEGER DEFAULT 0,
          last_clicked TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating links table:', err);
          reject(err);
          return;
        }
        
        // Create index
        db.run(`
          CREATE INDEX IF NOT EXISTS idx_short_code 
          ON links(short_code)
        `, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            reject(err);
            return;
          }
          console.log('Database initialized successfully');
          resolve();
        });
      });
    });
  });
};

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  initializeDatabase,
  runQuery,
  getQuery,
  allQuery
};