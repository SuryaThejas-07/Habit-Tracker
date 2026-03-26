/**
 * User Controller
 * Handles registration, login, and profile retrieval
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'habit_tracker_secret';
const JWT_EXPIRES = '7d';

/**
 * Generate a JWT token for a user
 */
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

/**
 * POST /api/users/register
 * Register a new user
 */
async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email already exists
        const existing = userModel.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email is already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = userModel.createUser(name.trim(), email.toLowerCase().trim(), hashedPassword);

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
}

/**
 * POST /api/users/login
 * Authenticate user and return JWT
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = userModel.findByEmail(email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
}

/**
 * GET /api/users/profile
 * Get current user's profile (requires authentication)
 */
function getProfile(req, res) {
    try {
        const user = userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        console.error('Profile error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
}

/**
 * GET /api/users/settings
 * Get current user settings
 */
function getSettings(req, res) {
    try {
        const settings = userModel.getSettings(req.user.id);
        res.json({ settings });
    } catch (err) {
        console.error('Get settings error:', err.message);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
}

/**
 * PUT /api/users/settings
 * Update user settings/preferences
 */
function updateSettings(req, res) {
    try {
        const validWeekStart = ['monday', 'sunday'];
        const validTheme = ['light', 'dark'];
        const {
            timezone,
            week_start_day,
            preferred_theme,
            reminders_enabled,
            reminder_time
        } = req.body;

        const safeSettings = {
            timezone: (timezone || 'UTC').trim(),
            week_start_day: validWeekStart.includes(week_start_day) ? week_start_day : 'monday',
            preferred_theme: validTheme.includes(preferred_theme) ? preferred_theme : 'light',
            reminders_enabled: reminders_enabled ? 1 : 0,
            reminder_time: /^([01]\d|2[0-3]):([0-5]\d)$/.test(reminder_time || '') ? reminder_time : '08:00'
        };

        const settings = userModel.updateSettings(req.user.id, safeSettings);
        res.json({ message: 'Settings updated successfully', settings });
    } catch (err) {
        console.error('Update settings error:', err.message);
        res.status(500).json({ error: 'Failed to update settings' });
    }
}

/**
 * PUT /api/users/account
 * Update account profile and optional password
 */
async function updateAccount(req, res) {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const existing = userModel.findByEmail(email.toLowerCase().trim());
        if (existing && existing.id !== req.user.id) {
            return res.status(409).json({ error: 'Email is already registered' });
        }

        const currentUserAuth = userModel.findByEmail(req.user.email);
        if (!currentUserAuth) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to set a new password' });
            }

            const validCurrent = await bcrypt.compare(currentPassword, currentUserAuth.password);
            if (!validCurrent) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            userModel.updatePassword(req.user.id, hashedPassword);
        }

        const user = userModel.updateProfile(req.user.id, {
            name: name.trim(),
            email: email.toLowerCase().trim()
        });

        const token = generateToken(user);
        res.json({
            message: 'Account updated successfully',
            token,
            user
        });
    } catch (err) {
        console.error('Update account error:', err.message);
        res.status(500).json({ error: 'Failed to update account' });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    getSettings,
    updateSettings,
    updateAccount
};
