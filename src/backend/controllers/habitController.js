/**
 * Habit Controller
 * Handles CRUD operations for habits and daily logging
 */

const habitModel = require('../models/habitModel');

/**
 * GET /api/habits
 * Get all habits for the logged-in user (with today's status)
 */
function getHabits(req, res) {
    try {
        const habits = habitModel.getAll(req.user.id);
        res.json({ habits });
    } catch (err) {
        console.error('Get habits error:', err.message);
        res.status(500).json({ error: 'Failed to fetch habits' });
    }
}

/**
 * GET /api/habits/:id
 * Get a single habit by ID
 */
function getHabit(req, res) {
    try {
        const habit = habitModel.getById(parseInt(req.params.id), req.user.id);
        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }
        res.json({ habit });
    } catch (err) {
        console.error('Get habit error:', err.message);
        res.status(500).json({ error: 'Failed to fetch habit' });
    }
}

/**
 * POST /api/habits
 * Create a new habit
 */
function createHabit(req, res) {
    try {
        const { title, frequency, icon, description, category, tags } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Habit title is required' });
        }

        // Validate icon
        const validIcons = ['fitness', 'study', 'water', 'sleep', 'general', 'default'];
        const selectedIcon = validIcons.includes(icon) ? icon : 'default';

        // Validate frequency
        const validFrequencies = ['daily', 'weekly'];
        const selectedFrequency = validFrequencies.includes(frequency) ? frequency : 'daily';

        const selectedCategory = (category || 'general').toString().trim().toLowerCase();
        const sanitizedTags = Array.isArray(tags)
            ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8).join(',')
            : String(tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 8).join(',');

        const habit = habitModel.create(
            req.user.id,
            title.trim(),
            selectedFrequency,
            selectedIcon,
            description || '',
            selectedCategory,
            sanitizedTags
        );

        res.status(201).json({ message: 'Habit created successfully', habit });
    } catch (err) {
        console.error('Create habit error:', err.message);
        res.status(500).json({ error: 'Failed to create habit' });
    }
}

/**
 * PUT /api/habits/:id
 * Update an existing habit
 */
function updateHabit(req, res) {
    try {
        const { title, frequency, icon, description, category, tags } = req.body;

        const sanitizedCategory = category ? String(category).trim().toLowerCase() : undefined;
        const sanitizedTags = tags === undefined
            ? undefined
            : (Array.isArray(tags)
                ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 8).join(',')
                : String(tags).split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 8).join(','));

        const habit = habitModel.update(
            parseInt(req.params.id),
            req.user.id,
            {
                title,
                frequency,
                icon,
                description,
                category: sanitizedCategory,
                tags: sanitizedTags
            }
        );

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found or unauthorized' });
        }

        res.json({ message: 'Habit updated successfully', habit });
    } catch (err) {
        console.error('Update habit error:', err.message);
        res.status(500).json({ error: 'Failed to update habit' });
    }
}

/**
 * DELETE /api/habits/:id
 * Delete a habit
 */
function deleteHabit(req, res) {
    try {
        const deleted = habitModel.delete(parseInt(req.params.id), req.user.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Habit not found or unauthorized' });
        }
        res.json({ message: 'Habit deleted successfully' });
    } catch (err) {
        console.error('Delete habit error:', err.message);
        res.status(500).json({ error: 'Failed to delete habit' });
    }
}

/**
 * POST /api/habits/:id/log
 * Toggle today's completion log for a habit
 */
function logHabit(req, res) {
    try {
        const habitId = parseInt(req.params.id);
        const habit = habitModel.getById(habitId, req.user.id);

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found or unauthorized' });
        }

        // Use provided date or today
        const date = req.body.date || new Date().toISOString().slice(0, 10);
        const result = habitModel.toggleLog(habitId, date);

        res.json({
            message: result.action === 'logged' ? 'Habit marked as complete' : 'Habit unmarked',
            ...result
        });
    } catch (err) {
        console.error('Log habit error:', err.message);
        res.status(500).json({ error: 'Failed to log habit' });
    }
}

/**
 * GET /api/habits/:id/logs
 * Get logs for a habit (query: startDate, endDate)
 */
function getHabitLogs(req, res) {
    try {
        const habitId = parseInt(req.params.id);
        const habit = habitModel.getById(habitId, req.user.id);

        if (!habit) {
            return res.status(404).json({ error: 'Habit not found' });
        }

        const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);
        const startDate = req.query.startDate || (() => {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString().slice(0, 10);
        })();

        const logs = habitModel.getLogs(habitId, startDate, endDate);
        res.json({ habit, logs });
    } catch (err) {
        console.error('Get logs error:', err.message);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
}

module.exports = { getHabits, getHabit, createHabit, updateHabit, deleteHabit, logHabit, getHabitLogs };
