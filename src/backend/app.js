/**
 * Habit Tracking System - Main Express Application
 * Entry point for the backend server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const habitRoutes = require('./routes/habitRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Habit Tracker API is running', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────
// SPA Fallback – serve frontend for all other routes
// ─────────────────────────────────────────────────
app.get('*', (req, res) => {
    // API routes that weren't matched should return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Serve frontend pages
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});

// ─────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🌟 Habit Tracker Server running at http://localhost:${PORT}`);
    console.log(`📊 Analytics Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`🔑 Login Page: http://localhost:${PORT}/login.html`);
    console.log(`📡 API Health Check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
