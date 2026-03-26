/**
 * Analytics Routes
 * Endpoints for habit analytics and insights
 */

const express = require('express');
const router = express.Router();
const {
    getSummary,
    getDailyAnalytics,
    getWeeklyAnalytics,
    getMonthlyAnalytics,
    getStreaks
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

// All analytics routes require authentication
router.use(authenticate);

router.get('/summary', getSummary);       // GET /api/analytics/summary
router.get('/daily', getDailyAnalytics);  // GET /api/analytics/daily?days=7
router.get('/weekly', getWeeklyAnalytics);// GET /api/analytics/weekly
router.get('/monthly', getMonthlyAnalytics); // GET /api/analytics/monthly
router.get('/streaks', getStreaks);        // GET /api/analytics/streaks

module.exports = router;
