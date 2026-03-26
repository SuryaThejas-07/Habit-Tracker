/**
 * User Model
 * Handles all database operations for the users table
 */

const db = require('../config/db');

const userModel = {
    /**
     * Find a user by their email address
     * @param {string} email
     * @returns {Object|undefined} user record or undefined
     */
    findByEmail(email) {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    },

    /**
     * Find a user by their ID
     * @param {number} id
     * @returns {Object|undefined}
     */
    findById(id) {
        const stmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
        return stmt.get(id);
    },

    /**
     * Create a new user
     * @param {string} name
     * @param {string} email
     * @param {string} hashedPassword - bcrypt hashed password
     * @returns {Object} { id, name, email }
     */
    createUser(name, email, hashedPassword) {
        const stmt = db.prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        );
        const result = stmt.run(name, email, hashedPassword);
        return { id: result.lastInsertRowid, name, email };
    },

    /**
     * Update profile fields for user
     * @param {number} id
     * @param {{name: string, email: string}} profile
     * @returns {Object|undefined}
     */
    updateProfile(id, { name, email }) {
        const stmt = db.prepare(
            'UPDATE users SET name = ?, email = ? WHERE id = ?'
        );
        stmt.run(name, email, id);
        return this.findById(id);
    },

    /**
     * Update password hash for user
     * @param {number} id
     * @param {string} hashedPassword
     */
    updatePassword(id, hashedPassword) {
        const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
        stmt.run(hashedPassword, id);
    },

    /**
     * Get user settings (lazy-create default row)
     * @param {number} userId
     * @returns {Object}
     */
    getSettings(userId) {
        let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
        if (!settings) {
            db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
            settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
        }
        return settings;
    },

    /**
     * Update user settings
     * @param {number} userId
     * @param {{timezone: string, week_start_day: string, preferred_theme: string, reminders_enabled: number, reminder_time: string}} settings
     * @returns {Object}
     */
    updateSettings(userId, settings) {
        this.getSettings(userId);
        const stmt = db.prepare(`
            UPDATE user_settings
            SET timezone = ?,
                week_start_day = ?,
                preferred_theme = ?,
                reminders_enabled = ?,
                reminder_time = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `);
        stmt.run(
            settings.timezone,
            settings.week_start_day,
            settings.preferred_theme,
            settings.reminders_enabled,
            settings.reminder_time,
            userId
        );
        return this.getSettings(userId);
    },

    /**
     * Get all users (admin use only)
     * @returns {Array}
     */
    getAll() {
        const stmt = db.prepare('SELECT id, name, email, created_at FROM users');
        return stmt.all();
    }
};

module.exports = userModel;
