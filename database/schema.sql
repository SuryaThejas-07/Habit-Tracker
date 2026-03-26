-- Habit Tracking System Database Schema
-- SQLite compatible

-- Drop tables if they exist (for fresh setup)
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Habits table
CREATE TABLE habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly
    icon TEXT NOT NULL DEFAULT 'fitness',    -- fitness, study, water, sleep, default
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT NOT NULL DEFAULT '',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily Logs table
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,              -- stored as YYYY-MM-DD
    status TEXT NOT NULL DEFAULT 'completed', -- completed, missed
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE(habit_id, date)           -- one log per habit per day
);

-- User settings and preferences
CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    week_start_day TEXT NOT NULL DEFAULT 'monday',
    preferred_theme TEXT NOT NULL DEFAULT 'light',
    reminders_enabled INTEGER NOT NULL DEFAULT 0,
    reminder_time TEXT NOT NULL DEFAULT '08:00',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample seed data (optional, comment out in production)
-- INSERT INTO users (name, email, password) VALUES ('Demo User', 'demo@example.com', '$2a$10$...');
