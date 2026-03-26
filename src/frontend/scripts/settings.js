document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    bindSettingsForms();
    await loadSettingsPage();
});

function bindSettingsForms() {
    document.getElementById('settingsForm')?.addEventListener('submit', savePreferences);
    document.getElementById('accountForm')?.addEventListener('submit', saveAccount);
}

async function loadSettingsPage() {
    try {
        const [profileRes, settingsRes] = await Promise.all([
            apiFetch('/users/profile'),
            apiFetch('/users/settings')
        ]);

        const user = profileRes.user;
        const settings = settingsRes.settings;

        document.getElementById('accountNameInput').value = user.name || '';
        document.getElementById('accountEmailInput').value = user.email || '';

        document.getElementById('timezoneInput').value = settings.timezone || 'UTC';
        document.getElementById('weekStartInput').value = settings.week_start_day || 'monday';
        document.getElementById('preferredThemeInput').value = settings.preferred_theme || 'light';
        document.getElementById('remindersEnabledInput').value = String(settings.reminders_enabled ? 1 : 0);
        document.getElementById('reminderTimeInput').value = settings.reminder_time || '08:00';
    } catch (err) {
        showToast('Failed to load settings: ' + err.message, 'error');
    }
}

async function savePreferences(event) {
    event.preventDefault();
    const button = document.getElementById('saveSettingsBtn');
    button.disabled = true;
    button.textContent = 'Saving...';

    try {
        const payload = {
            timezone: document.getElementById('timezoneInput').value.trim(),
            week_start_day: document.getElementById('weekStartInput').value,
            preferred_theme: document.getElementById('preferredThemeInput').value,
            reminders_enabled: document.getElementById('remindersEnabledInput').value === '1',
            reminder_time: document.getElementById('reminderTimeInput').value || '08:00'
        };

        await apiFetch('/users/settings', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        try {
            localStorage.setItem('ht_theme', payload.preferred_theme);
            document.documentElement.setAttribute('data-theme', payload.preferred_theme);
        } catch {
            // no-op
        }

        showToast('Preferences saved', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Save Preferences';
    }
}

async function saveAccount(event) {
    event.preventDefault();
    const button = document.getElementById('saveAccountBtn');
    button.disabled = true;
    button.textContent = 'Updating...';

    try {
        const payload = {
            name: document.getElementById('accountNameInput').value.trim(),
            email: document.getElementById('accountEmailInput').value.trim(),
            currentPassword: document.getElementById('currentPasswordInput').value,
            newPassword: document.getElementById('newPasswordInput').value
        };

        const res = await apiFetch('/users/account', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        saveSession(res.token, res.user);
        document.getElementById('currentPasswordInput').value = '';
        document.getElementById('newPasswordInput').value = '';
        showToast('Account updated successfully', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Update Account';
    }
}
