const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initializeTables } = require('./db-init');

const dbPath = path.join(__dirname, 'pta-cashiering.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
  initializeTables(db)
    .then(() => {
      console.log('\n✓ Database initialization complete!');
      db.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Initialization error:', err);
      db.close();
      process.exit(1);
    });
});
