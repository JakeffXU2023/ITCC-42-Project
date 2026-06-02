const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { initializeTables } = require('./db-init');

const DEFAULT_SCHOOL_YEAR = '2024-2025';

let dbPath;
let currentSchoolYear = DEFAULT_SCHOOL_YEAR;

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

function getStorageDirectory() {
  try {
    const electron = require('electron');
    const app = electron.app || (electron.remote && electron.remote.app);
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData');
    }
  } catch {
    // Fall back to the backend folder when Electron is unavailable.
  }
  return __dirname;
}

function getSettingsPath() {
  return path.join(getStorageDirectory(), 'pta-cashiering-settings.json');
}

function normalizeSchoolYear(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{4})$/);
  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || endYear !== startYear + 1) {
    return null;
  }

  return `${startYear}-${endYear}`;
}

function getDatabasePathForSchoolYear(schoolYear) {
  return path.join(getStorageDirectory(), `pta-cashiering-${schoolYear}.db`);
}

function readSettingsFile() {
  const settingsPath = getSettingsPath();
  if (!fs.existsSync(settingsPath)) {
    return { schoolYear: DEFAULT_SCHOOL_YEAR, exists: false };
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    const schoolYear = normalizeSchoolYear(parsed.schoolYear) || DEFAULT_SCHOOL_YEAR;
    return { schoolYear, exists: true };
  } catch {
    return { schoolYear: DEFAULT_SCHOOL_YEAR, exists: false };
  }
}

function writeSettingsFile(schoolYear) {
  const settingsPath = getSettingsPath();
  fs.writeFileSync(settingsPath, JSON.stringify({ schoolYear }, null, 2), 'utf8');
}

function openDatabase(databasePath) {
  return new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(databasePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
}

async function prepareDatabase(databasePath, seedFromLegacy = false) {
  if (seedFromLegacy && !fs.existsSync(databasePath)) {
    const legacyPath = path.join(__dirname, 'pta-cashiering.db');
    if (legacyPath !== databasePath && fs.existsSync(legacyPath)) {
      fs.copyFileSync(legacyPath, databasePath);
    }
  }

  const connection = await openDatabase(databasePath);
  await initializeTables(connection);
  return connection;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const settings = readSettingsFile();
    const schoolYear = settings.schoolYear || DEFAULT_SCHOOL_YEAR;
    const databasePath = getDatabasePathForSchoolYear(schoolYear);
    const seedFromLegacy = schoolYear === DEFAULT_SCHOOL_YEAR;

    prepareDatabase(databasePath, seedFromLegacy)
      .then((connection) => {
        db = connection;
        dbPath = databasePath;
        currentSchoolYear = schoolYear;
        if (!settings.exists) {
          writeSettingsFile(schoolYear);
        }
        console.log('Connected to SQLite database at:', dbPath);
        resolve(db);
      })
      .catch((err) => reject(err));
  });
}

function getDatabase() {
  return db;
}

function getCurrentSchoolYear() {
  return currentSchoolYear;
}

function getCurrentDatabasePath() {
  return dbPath;
}

async function switchSchoolYear(schoolYear) {
  const normalizedSchoolYear = normalizeSchoolYear(schoolYear);
  if (!normalizedSchoolYear) {
    throw new Error('School year must be in YYYY-YYYY format and span consecutive years.');
  }

  if (normalizedSchoolYear === currentSchoolYear && db) {
    return {
      schoolYear: currentSchoolYear,
      databasePath: dbPath,
    };
  }

  const nextDatabasePath = getDatabasePathForSchoolYear(normalizedSchoolYear);
  const nextDb = await prepareDatabase(nextDatabasePath, false);
  const previousDb = db;

  db = nextDb;
  dbPath = nextDatabasePath;
  currentSchoolYear = normalizedSchoolYear;
  writeSettingsFile(normalizedSchoolYear);

  if (previousDb && previousDb !== nextDb) {
    await new Promise((resolve) => {
      previousDb.close((closeErr) => {
        if (closeErr) {
          console.error('Failed to close previous database:', closeErr);
        }
        resolve();
      });
    });
  }

  return {
    schoolYear: currentSchoolYear,
    databasePath: dbPath,
  };
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
  getCurrentSchoolYear,
  getCurrentDatabasePath,
  normalizeSchoolYear,
  switchSchoolYear,
  runAsync,
  getAsync,
  allAsync
};
