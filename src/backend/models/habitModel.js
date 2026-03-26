/**
 * Habit Model
 * Handles all database operations for habits and logs tables
 */

const db = require('../config/db');

const habitModel = {
    /**
     * Get all habits for a user (with today's completion status)
     * @param {number} userId
     * @returns {Array}
     */
    getAll(userId) {
        const today = new Date().toISOString().slice(0, 10);
        const stmt = db.prepare(`
      SELECT
        h.*,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END AS completed_today
      FROM habits h
      LEFT JOIN logs l
        ON l.habit_id = h.id AND l.date = ? AND l.status = 'completed'
      WHERE h.user_id = ?
      ORDER BY h.created_at ASC
    `);
        return stmt.all(today, userId);
    },

    /**
     * Get a single habit by ID (must belong to the user)
     * @param {number} id
     * @param {number} userId
     * @returns {Object|undefined}
     */
    getById(id, userId) {
        const stmt = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?');
        return stmt.get(id, userId);
    },

    /**
     * Create a new habit
     * @param {number} userId
     * @param {string} title
     * @param {string} frequency
     * @param {string} icon
     * @param {string} description
     * @returns {Object}
     */
    create(userId, title, frequency, icon, description, category, tags) {
        const stmt = db.prepare(
            'INSERT INTO habits (user_id, title, frequency, icon, description, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        const result = stmt.run(
            userId,
            title,
            frequency || 'daily',
            icon || 'fitness',
            description || '',
            category || 'general',
            tags || ''
        );
        return this.getById(result.lastInsertRowid, userId);
    },

    /**
     * Update an existing habit
     * @param {number} id
     * @param {number} userId
     * @param {Object} fields - { title, frequency, icon, description }
     * @returns {Object|null}
     */
        update(id, userId, { title, frequency, icon, description, category, tags }) {
        const habit = this.getById(id, userId);
        if (!habit) return null;

        const stmt = db.prepare(`
      UPDATE habits
            SET title = ?, frequency = ?, icon = ?, description = ?, category = ?, tags = ?
      WHERE id = ? AND user_id = ?
    `);
        stmt.run(
            title || habit.title,
            frequency || habit.frequency,
            icon || habit.icon,
            description !== undefined ? description : habit.description,
                        category || habit.category || 'general',
                        tags !== undefined ? tags : (habit.tags || ''),
            id,
            userId
        );
        return this.getById(id, userId);
    },

    /**
     * Delete a habit
     * @param {number} id
     * @param {number} userId
     * @returns {boolean}
     */
    delete(id, userId) {
        const stmt = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
        const result = stmt.run(id, userId);
        return result.changes > 0;
    },

    /**
     * Toggle daily log for a habit (complete / uncomplete)
     * @param {number} habitId
     * @param {string} date - YYYY-MM-DD
     * @returns {Object} { action: 'logged'|'removed', date }
     */
    toggleLog(habitId, date) {
        const existing = db.prepare(
            'SELECT * FROM logs WHERE habit_id = ? AND date = ?'
        ).get(habitId, date);

        if (existing) {
            db.prepare('DELETE FROM logs WHERE habit_id = ? AND date = ?').run(habitId, date);
            return { action: 'removed', date };
        } else {
            db.prepare(
                'INSERT INTO logs (habit_id, date, status) VALUES (?, ?, ?)'
            ).run(habitId, date, 'completed');
            return { action: 'logged', date };
        }
    },

    /**
     * Get logs for a habit over a date range
     * @param {number} habitId
     * @param {string} startDate - YYYY-MM-DD
     * @param {string} endDate - YYYY-MM-DD
     * @returns {Array}
     */
    getLogs(habitId, startDate, endDate) {
        const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE habit_id = ?
        AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `);
        return stmt.all(habitId, startDate, endDate);
    },

    /**
     * Get all logs for a user's habits over a date range
     * @param {number} userId
     * @param {string} startDate
     * @param {string} endDate
     * @returns {Array}
     */
    getUserLogs(userId, startDate, endDate) {
        const stmt = db.prepare(`
      SELECT l.*, h.title, h.icon
      FROM logs l
      JOIN habits h ON h.id = l.habit_id
      WHERE h.user_id = ?
        AND l.date BETWEEN ? AND ?
      ORDER BY l.date ASC
    `);
        return stmt.all(userId, startDate, endDate);
    }
};

module.exports = habitModel;
