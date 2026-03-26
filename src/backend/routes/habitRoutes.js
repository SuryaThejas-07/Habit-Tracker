/**
 * Habit Routes
 * CRUD and daily logging endpoints for habits
 */

const express = require('express');
const router = express.Router();
const {
    getHabits,
    getHabit,
    createHabit,
    updateHabit,
    deleteHabit,
    logHabit,
    getHabitLogs
} = require('../controllers/habitController');
const { authenticate } = require('../middleware/auth');

// All habit routes require authentication
router.use(authenticate);

router.get('/', getHabits);           // GET  /api/habits
router.get('/:id', getHabit);         // GET  /api/habits/:id
router.post('/', createHabit);        // POST /api/habits
router.put('/:id', updateHabit);      // PUT  /api/habits/:id
router.delete('/:id', deleteHabit);   // DELETE /api/habits/:id
router.post('/:id/log', logHabit);    // POST /api/habits/:id/log
router.get('/:id/logs', getHabitLogs);// GET  /api/habits/:id/logs

module.exports = router;
