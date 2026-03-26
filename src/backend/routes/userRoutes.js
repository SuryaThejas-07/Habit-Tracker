/**
 * User Routes
 * Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const {
	register,
	login,
	getProfile,
	getSettings,
	updateSettings,
	updateAccount
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, updateSettings);
router.put('/account', authenticate, updateAccount);

module.exports = router;
