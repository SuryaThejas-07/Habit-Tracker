/**
 * Database Configuration
 * Initializes SQLite database with better-sqlite3
 * Creates all tables from schema on first boot
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Resolve DB path from project root
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../../../database/habit_tracker.db');

// Ensure the database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize the database connection
let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');   // Better write performance
  db.pragma('foreign_keys = ON');    // Enforce foreign key constraints
} catch (err) {
  console.error('Failed to open database:', err.message);
  process.exit(1);
}

/**
 * Initialize database tables (run once on startup)
 */
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'daily',
      icon TEXT NOT NULL DEFAULT 'fitness',
      category TEXT NOT NULL DEFAULT 'general',
      tags TEXT NOT NULL DEFAULT '',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      week_start_day TEXT NOT NULL DEFAULT 'monday',
      preferred_theme TEXT NOT NULL DEFAULT 'light',
      reminders_enabled INTEGER NOT NULL DEFAULT 0,
      reminder_time TEXT NOT NULL DEFAULT '08:00',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe schema migration for already existing databases.
  const habitColumns = db.prepare(`PRAGMA table_info(habits)`).all();
  const hasCategory = habitColumns.some(col => col.name === 'category');
  const hasTags = habitColumns.some(col => col.name === 'tags');

  if (!hasCategory) {
    db.exec(`ALTER TABLE habits ADD COLUMN category TEXT NOT NULL DEFAULT 'general';`);
  }

  if (!hasTags) {
    db.exec(`ALTER TABLE habits ADD COLUMN tags TEXT NOT NULL DEFAULT '';`);
  }

  console.log('✅ Database initialized successfully');
}

// Run initialization on module load
initializeDatabase();

module.exports = db;
