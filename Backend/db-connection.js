const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initializeTables } = require('./db-init');

let dbPath;

try {
  const electron = require('electron');
  const app = electron.app || (electron.remote && electron.remote.app);
  if (app && typeof app.getPath === 'function') {
    dbPath = path.join(app.getPath('userData'), 'pta-cashiering.db');
  } else {
    throw new Error('Electron app unavailable');
  }
} catch {
  dbPath = path.join(__dirname, 'pta-cashiering.db');
}

let db = null;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database at:', dbPath);
        // Ensure required tables and default data exist
        initializeTables(db)
          .then(() => resolve(db))
          .catch((initErr) => {
            console.error('Database initialization failed:', initErr);
            reject(initErr);
          });
      }
    });
  });
}

function getDatabase() {
  return db;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runAsync,
  getAsync,
  allAsync
};
