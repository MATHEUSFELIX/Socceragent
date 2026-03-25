// Simple SQLite wrapper used for persistent storage of sessions and world cup
// data. For production you may replace this with PostgreSQL or another
// database client.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db;

/**
 * Initialise the SQLite database. This will create the database file if it
 * doesn't exist, and ensure required tables are present.
 */
async function initDb() {
  const dbFile = process.env.DB_FILE || 'database.sqlite';
  const dbPath = path.isAbsolute(dbFile)
    ? dbFile
    : path.join(__dirname, '../../', dbFile);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new sqlite3.Database(dbPath);

  await run(
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS worldcups (
      year INTEGER PRIMARY KEY,
      squad TEXT NOT NULL
    )`
  );
  // Preload some sample world cup squads for Brazil if not present
  const years = [1994, 2002, 2014, 2018, 2022];
  for (const year of years) {
    const row = await get('SELECT year FROM worldcups WHERE year = ?', [year]);
    if (!row) {
      const squad = require('../data/brazilPlayers')[year] || [];
      await run('INSERT INTO worldcups (year, squad) VALUES (?, ?)', [year, JSON.stringify(squad)]);
    }
  }
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  initDb,
  runQuery: run,
  getRow: get,
  getAll: all,
};