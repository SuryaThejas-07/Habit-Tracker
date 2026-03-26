/**
 * Analytics Controller
 * Calculates and returns habit analytics: streaks, completion rates, summaries
 */

const habitModel = require('../models/habitModel');
const db = require('../config/db');

/**
 * Helper: Get a date string N days ago
 */
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

/**
 * Helper: Generate date range array (YYYY-MM-DD strings)
 */
function dateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}

/**
 * Helper: Calculate streak for a habit (consecutive days from today)
 */
function calculateStreak(habitId) {
    const logs = db.prepare(`
    SELECT date FROM logs
    WHERE habit_id = ? AND status = 'completed'
    ORDER BY date DESC
  `).all(habitId);

    if (!logs.length) return 0;

    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    let currentDate = new Date(today);

    for (let i = 0; i < logs.length; i++) {
        const logDate = currentDate.toISOString().slice(0, 10);
        if (logs[i].date === logDate) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (i === 0 && logs[0].date !== today) {
            // Streak didn't include today — check yesterday
            currentDate.setDate(currentDate.getDate() - 1);
            if (logs[0].date === currentDate.toISOString().slice(0, 10)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return streak;
}

/**
 * GET /api/analytics/summary
 * Overview: total habits, today's completion, overall rate, best streak
 */
function getSummary(req, res) {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().slice(0, 10);

        // Total habits
        const totalHabits = db.prepare(
            'SELECT COUNT(*) as count FROM habits WHERE user_id = ?'
        ).get(userId).count;

        // Completed today
        const completedToday = db.prepare(`
      SELECT COUNT(*) as count
      FROM logs l
      JOIN habits h ON h.id = l.habit_id
      WHERE h.user_id = ? AND l.date = ? AND l.status = 'completed'
    `).get(userId, today).count;

        // All habits with streaks
        const habits = db.prepare(
            'SELECT id, title, icon FROM habits WHERE user_id = ?'
        ).all(userId);

        let bestStreak = 0;
        let totalStreak = 0;
        const habitStreaks = habits.map(h => {
            const streak = calculateStreak(h.id);
            if (streak > bestStreak) bestStreak = streak;
            totalStreak += streak;
            return { ...h, streak };
        });

        // 30-day completion rate
        const start30 = daysAgo(29);
        const logs30 = db.prepare(`
      SELECT COUNT(*) as count
      FROM logs l
      JOIN habits h ON h.id = l.habit_id
      WHERE h.user_id = ? AND l.date BETWEEN ? AND ? AND l.status = 'completed'
    `).get(userId, start30, today).count;

        const possibleLogs = totalHabits * 30;
        const completionRate = possibleLogs > 0
            ? Math.round((logs30 / possibleLogs) * 100)
            : 0;

        res.json({
            summary: {
                totalHabits,
                completedToday,
                completionRate,
                bestStreak,
                averageStreak: habits.length > 0 ? Math.round(totalStreak / habits.length) : 0
            },
            habitStreaks
        });
    } catch (err) {
        console.error('Analytics summary error:', err.message);
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
}

/**
 * GET /api/analytics/daily?days=7
 * Daily completions for the last N days
 */
function getDailyAnalytics(req, res) {
    try {
        const userId = req.user.id;
        const days = parseInt(req.query.days) || 7;
        const today = new Date().toISOString().slice(0, 10);
        const startDate = daysAgo(days - 1);

        const totalHabits = db.prepare(
            'SELECT COUNT(*) as count FROM habits WHERE user_id = ?'
        ).get(userId).count;

        const logsPerDay = db.prepare(`
      SELECT l.date, COUNT(*) as completed
      FROM logs l
      JOIN habits h ON h.id = l.habit_id
      WHERE h.user_id = ? AND l.date BETWEEN ? AND ? AND l.status = 'completed'
      GROUP BY l.date
    `).all(userId, startDate, today);

        // Build complete date range (fill 0s for days with no completions)
        const dates = dateRange(startDate, today);
        const logMap = {};
        logsPerDay.forEach(r => { logMap[r.date] = r.completed; });

        const daily = dates.map(date => ({
            date,
            completed: logMap[date] || 0,
            total: totalHabits,
            rate: totalHabits > 0 ? Math.round(((logMap[date] || 0) / totalHabits) * 100) : 0
        }));

        res.json({ daily });
    } catch (err) {
        console.error('Daily analytics error:', err.message);
        res.status(500).json({ error: 'Failed to fetch daily analytics' });
    }
}

/**
 * GET /api/analytics/weekly
 * Weekly completion breakdown (last 4 weeks)
 */
function getWeeklyAnalytics(req, res) {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().slice(0, 10);
        const startDate = daysAgo(27); // ~4 weeks

        const totalHabits = db.prepare(
            'SELECT COUNT(*) as count FROM habits WHERE user_id = ?'
        ).get(userId).count;

        const logsPerDay = db.prepare(`
      SELECT l.date, COUNT(*) as completed
      FROM logs l
      JOIN habits h ON h.id = l.habit_id
      WHERE h.user_id = ? AND l.date BETWEEN ? AND ? AND l.status = 'completed'
      GROUP BY l.date
    `).all(userId, startDate, today);

        const logMap = {};
        logsPerDay.forEach(r => { logMap[r.date] = r.completed; });

        // Group into 4 weeks
        const weeks = [];
        for (let w = 0; w < 4; w++) {
            const weekStart = daysAgo(27 - (w * 7));
            const weekEnd = daysAgo(27 - (w * 7) - 6);
            const weekDates = dateRange(
                weekEnd <= today ? weekEnd : startDate,
                weekStart <= today ? weekStart : today
            );

            let weekCompleted = 0;
            weekDates.forEach(d => { weekCompleted += (logMap[d] || 0); });

            const possible = totalHabits * weekDates.length;
            weeks.push({
                week: `Week ${w + 1}`,
                startDate: weekDates[0] || weekStart,
                completed: weekCompleted,
                possible,
                rate: possible > 0 ? Math.round((weekCompleted / possible) * 100) : 0
            });
        }

        res.json({ weekly: weeks });
    } catch (err) {
        console.error('Weekly analytics error:', err.message);
        res.status(500).json({ error: 'Failed to fetch weekly analytics' });
    }
}

/**
 * GET /api/analytics/monthly
 * Monthly completion breakdown (last 6 months)
 */
function getMonthlyAnalytics(req, res) {
    try {
        const userId = req.user.id;
        const months = [];

        for (let m = 5; m >= 0; m--) {
            const d = new Date();
            d.setMonth(d.getMonth() - m);
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            const monthStr = `${year}-${String(month).padStart(2, '0')}`;

            const result = db.prepare(`
        SELECT COUNT(*) as count
        FROM logs l
        JOIN habits h ON h.id = l.habit_id
        WHERE h.user_id = ? AND l.date LIKE ? AND l.status = 'completed'
      `).get(userId, `${monthStr}%`);

            const habitCount = db.prepare(
                'SELECT COUNT(*) as count FROM habits WHERE user_id = ? AND created_at <= ?'
            ).get(userId, `${monthStr}-31 23:59:59`).count;

            const daysInMonth = new Date(year, month, 0).getDate();
            const possible = habitCount * daysInMonth;

            months.push({
                month: new Date(year, month - 1).toLocaleString('default', { month: 'short', year: '2-digit' }),
                completed: result.count,
                possible,
                rate: possible > 0 ? Math.round((result.count / possible) * 100) : 0
            });
        }

        res.json({ monthly: months });
    } catch (err) {
        console.error('Monthly analytics error:', err.message);
        res.status(500).json({ error: 'Failed to fetch monthly analytics' });
    }
}

/**
 * GET /api/analytics/streaks
 * Individual habit streaks for all habits
 */
function getStreaks(req, res) {
    try {
        const userId = req.user.id;
        const habits = db.prepare(
            'SELECT id, title, icon FROM habits WHERE user_id = ?'
        ).all(userId);

        const streaks = habits.map(h => ({
            ...h,
            currentStreak: calculateStreak(h.id),
            totalCompletions: db.prepare(
                'SELECT COUNT(*) as count FROM logs WHERE habit_id = ? AND status = ?'
            ).get(h.id, 'completed').count
        }));

        res.json({ streaks });
    } catch (err) {
        console.error('Streaks error:', err.message);
        res.status(500).json({ error: 'Failed to fetch streaks' });
    }
}

module.exports = { getSummary, getDailyAnalytics, getWeeklyAnalytics, getMonthlyAnalytics, getStreaks };
