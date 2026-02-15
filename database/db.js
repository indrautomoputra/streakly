const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const newDbPath = path.join(__dirname, '..', 'streakly.db');
const oldDbPath = path.join(__dirname, '..', 'productivity.db');

if (!fs.existsSync(newDbPath) && fs.existsSync(oldDbPath)) {
  try {
    fs.copyFileSync(oldDbPath, newDbPath);
    console.log('Database migrated to streakly.db (copy preserved).');
  } catch (e) {
    console.error('Failed to copy existing database for migration:', e);
  }
}

const envPath = process.env.STREAKLY_DB_PATH;
const dbPath = envPath ? path.resolve(envPath) : newDbPath;

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log("SQLite connected");
});

db.dbPath = dbPath;

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA busy_timeout = 3000');
});

module.exports = db;
