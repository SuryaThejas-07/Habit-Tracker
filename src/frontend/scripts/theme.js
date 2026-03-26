/**
 * theme.js – Light / Dark Theme Toggle
 * Manages theme switching and persistence via localStorage.
 * Applied immediately (before paint) to prevent Flash Of Unstyled Content.
 */

(function () {
    var STORAGE_KEY = 'ht_theme';
    var LIGHT = 'light';
    var DARK = 'dark';

    /** Apply theme by setting data-theme on <html> */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        updateIcons(theme);
    }

    /** Update every toggle button icon to match current theme */
    function updateIcons(theme) {
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            btn.textContent = theme === DARK ? '☀️' : '🌙';
            btn.title = theme === DARK ? 'Switch to Light Mode' : 'Switch to Dark Mode';
            btn.setAttribute('aria-label', btn.title);
        });
    }

    /** Toggle between light and dark, save preference */
    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || LIGHT;
        var next = current === DARK ? LIGHT : DARK;
        applyTheme(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { }
    }

    /** Attach click listeners to all toggle buttons */
    function wireButtons() {
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            // Remove any duplicates first
            btn.removeEventListener('click', toggleTheme);
            btn.addEventListener('click', toggleTheme);
        });
    }

    /** Load saved theme (default: light) */
    function loadTheme() {
        var saved;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { }
        applyTheme(saved || LIGHT);
    }

    // ── Apply immediately ──────────────────────────────────────
    loadTheme();

    // ── Wire buttons after DOM is ready ───────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireButtons);
    } else {
        wireButtons();
    }

    // ── Expose for any legacy onclick="" references ────────────
    // NOTE: HTML buttons use class-based event listeners only.
    // This is kept for backward compatibility but buttons should
    // NOT have onclick="toggleTheme()" to avoid double-firing.
    window.toggleTheme = toggleTheme;
})();
