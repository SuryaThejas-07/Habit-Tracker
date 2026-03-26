/**
 * auth.js – Authentication utilities
 * Handles login, register, token storage, and guards
 */

const API_BASE = '/api';

/* ─── Token / Session Helpers ─── */

function getToken() {
    return localStorage.getItem('ht_token');
}

function getUser() {
    try {
        const u = localStorage.getItem('ht_user');
        return u ? JSON.parse(u) : null;
    } catch { return null; }
}

function saveSession(token, user) {
    localStorage.setItem('ht_token', token);
    localStorage.setItem('ht_user', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('ht_token');
    localStorage.removeItem('ht_user');
}

function logout() {
    clearSession();
    window.location.href = '/login.html';
}

/* ─── Auth Guard (call on protected pages) ─── */
function requireAuth() {
    if (!getToken()) {
        window.location.href = '/login.html';
        return false;
    }
    // Populate greeting
    const user = getUser();
    const greeting = document.getElementById('userGreeting');
    if (greeting && user) {
        greeting.textContent = `Hi, ${user.name.split(' ')[0]} 👋`;
    }
    return true;
}

/* ─── Redirect if already logged in (for login page) ─── */
function redirectIfLoggedIn() {
    if (getToken()) {
        window.location.href = '/index.html';
    }
}

/* ─── Tab Switcher ─── */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

/* ─── API Fetch Helper ─── */
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            clearSession();
            window.location.href = '/login.html';
        }
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

/* ─── Toast Notifications ─── */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${message}</span>`;

    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ─── Login Handler ─── */
async function handleLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    btn.disabled = true;
    btnText.textContent = 'Signing in…';

    try {
        const data = await apiFetch('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        saveSession(data.token, data.user);
        showToast('Welcome back! Redirecting…', 'success');
        setTimeout(() => { window.location.href = '/index.html'; }, 800);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btnText.textContent = 'Sign In';
    }
}

/* ─── Register Handler ─── */
async function handleRegister(event) {
    event.preventDefault();
    const btn = document.getElementById('registerBtn');
    const btnText = document.getElementById('registerBtnText');
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    btn.disabled = true;
    btnText.textContent = 'Creating account…';

    try {
        const data = await apiFetch('/users/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        saveSession(data.token, data.user);
        showToast('Account created! Redirecting…', 'success');
        setTimeout(() => { window.location.href = '/index.html'; }, 800);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btnText.textContent = 'Create Account';
    }
}

/* ─── Initialize login page ─── */
if (window.location.pathname.includes('login')) {
    redirectIfLoggedIn();
}
