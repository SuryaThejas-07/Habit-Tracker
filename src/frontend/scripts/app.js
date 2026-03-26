/**
 * app.js – Habit Management Page
 * Handles CRUD for habits and daily logging
 */

// ─── State ───
let habits = [];
let selectedIcon = 'fitness';
let habitToDelete = null;
let statsSummary = null;
let habitStreaks = [];
const ONBOARDING_DISMISSED_KEY = 'ht_onboarding_dismissed';

/* ─── On Load ─── */
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    bindControlCenter();
    bindOnboardingGuide();

    // Set today's date in subtitle
    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    await loadHabits();
    await loadStats();
});

/* ─── Load Stats ─── */
async function loadStats() {
    try {
        const { summary, habitStreaks: streakData } = await apiFetch('/analytics/summary');
        statsSummary = summary;
        habitStreaks = streakData || [];

        const statTotal = document.getElementById('statTotal');
        const statToday = document.getElementById('statToday');
        const statStreak = document.getElementById('statStreak');
        const statRate = document.getElementById('statRate');

        if (statTotal) statTotal.textContent = summary.totalHabits;
        if (statToday) statToday.textContent = `${summary.completedToday}/${summary.totalHabits}`;
        if (statStreak) statStreak.textContent = `${summary.bestStreak}🔥`;
        if (statRate) statRate.textContent = `${summary.completionRate}%`;

        renderFocusStrip();
        renderHomeInsights();
    } catch (err) {
        console.error('Stats error:', err);
    }
}

/* ─── Load Habits ─── */
async function loadHabits() {
    try {
        const data = await apiFetch('/habits');
        habits = data.habits;
        refreshCategoryFilterOptions();
        renderHabits();
        renderRecentWins();
        renderFocusStrip();
        renderHomeInsights();
    } catch (err) {
        showToast('Failed to load habits: ' + err.message, 'error');
        document.getElementById('habitsGrid').innerHTML = '';
    }
}

function refreshCategoryFilterOptions() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    const selected = categoryFilter.value || 'all';
    const categories = [...new Set(habits.map(h => (h.category || 'general').trim().toLowerCase()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML = '<option value="all">All</option>' +
        categories.map(c => `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('');

    if (categories.includes(selected)) {
        categoryFilter.value = selected;
    } else {
        categoryFilter.value = 'all';
    }
}

function bindControlCenter() {
    const search = document.getElementById('habitSearch');
    const frequency = document.getElementById('frequencyFilter');
    const status = document.getElementById('statusFilter');
    const category = document.getElementById('categoryFilter');
    const tag = document.getElementById('tagFilter');
    const clear = document.getElementById('clearFiltersBtn');

    if (search) search.addEventListener('input', renderHabits);
    if (frequency) frequency.addEventListener('change', renderHabits);
    if (status) status.addEventListener('change', renderHabits);
    if (category) category.addEventListener('change', renderHabits);
    if (tag) tag.addEventListener('input', renderHabits);

    if (clear) {
        clear.addEventListener('click', () => {
            if (search) search.value = '';
            if (frequency) frequency.value = 'all';
            if (status) status.value = 'all';
            if (category) category.value = 'all';
            if (tag) tag.value = '';
            renderHabits();
        });
    }
}

function bindOnboardingGuide() {
    const dismissBtn = document.getElementById('dismissOnboardingBtn');
    if (!dismissBtn) return;

    dismissBtn.addEventListener('click', () => {
        localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
        const guide = document.getElementById('onboardingGuide');
        if (guide) guide.style.display = 'none';
    });
}

function getFilteredHabits() {
    const search = (document.getElementById('habitSearch')?.value || '').trim().toLowerCase();
    const frequency = document.getElementById('frequencyFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const tag = (document.getElementById('tagFilter')?.value || '').trim().toLowerCase();

    return habits.filter(h => {
        if (search && !h.title.toLowerCase().includes(search)) return false;
        if (frequency !== 'all' && h.frequency !== frequency) return false;
        if (status === 'done' && !h.completed_today) return false;
        if (status === 'pending' && h.completed_today) return false;
        if (category !== 'all' && (h.category || 'general') !== category) return false;
        if (tag) {
            const tagList = (h.tags || '').toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
            if (!tagList.some(t => t.includes(tag))) return false;
        }
        return true;
    });
}

/* ─── Render Habits ─── */
function renderHabits() {
    const grid = document.getElementById('habitsGrid');
    const empty = document.getElementById('emptyState');
    const emptyText = document.getElementById('emptyStateText');
    const templateActions = document.getElementById('templateActions');
    const onboardingGuide = document.getElementById('onboardingGuide');
    const filteredHabits = getFilteredHabits();
    const onboardingDismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1';

    if (onboardingGuide) {
        onboardingGuide.style.display = (!habits.length && !onboardingDismissed) ? 'flex' : 'none';
    }

    if (!habits.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        if (templateActions) templateActions.style.display = 'block';
        if (emptyText) emptyText.textContent = 'Start your journey by adding your first habit!';
        return;
    }

    if (templateActions) templateActions.style.display = 'none';

    if (!filteredHabits.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        if (emptyText) emptyText.textContent = 'No habits match your current filters.';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = filteredHabits.map(h => habitCardHTML(h)).join('');
}

/* ─── Habit Card HTML ─── */
function habitCardHTML(h) {
    const iconSrc = (h.icon === 'general' || h.icon === 'default')
        ? 'assets/images/logo.png'
        : `assets/images/icons/${h.icon}.png`;
    const freqBadge = h.frequency === 'daily'
        ? '<span class="badge badge-purple">📅 Daily</span>'
        : '<span class="badge badge-cyan">📆 Weekly</span>';
    const categoryBadge = `<span class="badge badge-green">🏷 ${((h.category || 'general').charAt(0).toUpperCase() + (h.category || 'general').slice(1))}</span>`;
    const tagBadges = (h.tags || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map(tag => `<span class="badge badge-orange">#${tag}</span>`)
        .join('');
    const completedClass = h.completed_today ? 'completed' : '';
    const checkLabel = h.completed_today ? '✓ Done' : '○ Mark Done';
    const checkClass = h.completed_today ? 'check-btn checked' : 'check-btn';

    return `
    <div class="habit-card ${completedClass} animate-fade-up" id="habit-${h.id}">
      <div class="habit-card-header">
        <div class="habit-icon-wrap">
          <img src="${iconSrc}" alt="${h.icon}" onerror="this.style.display='none'" />
        </div>
        <div class="habit-info">
          <div class="habit-title" title="${h.title}">${h.title}</div>
          <div class="habit-meta">
            ${freqBadge}
                        ${categoryBadge}
                        ${tagBadges}
          </div>
        </div>
      </div>
      ${h.description ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:-0.25rem;">${h.description}</p>` : ''}
      <div class="habit-actions">
        <button class="${checkClass}" onclick="toggleHabit(${h.id})" id="checkBtn-${h.id}">
          ${checkLabel}
        </button>
        <button class="icon-btn edit" title="Edit" onclick="openEditModal(${h.id})">✏️</button>
        <button class="icon-btn del" title="Delete" onclick="openDeleteModal(${h.id})">🗑️</button>
      </div>
    </div>
  `;
}

/* ─── Toggle Habit Completion ─── */
async function toggleHabit(id) {
    const btn = document.getElementById(`checkBtn-${id}`);
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

    try {
        const today = new Date().toISOString().slice(0, 10);
        const result = await apiFetch(`/habits/${id}/log`, {
            method: 'POST',
            body: JSON.stringify({ date: today })
        });

        const habit = habits.find(h => h.id === id);
        if (habit) habit.completed_today = result.action === 'logged' ? 1 : 0;

        renderHabits();
        renderRecentWins();
        renderFocusStrip();
        renderHomeInsights();
        await loadStats();
        showToast(result.message, 'success');
    } catch (err) {
        showToast('Failed to update habit: ' + err.message, 'error');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
}

/* ─── Modal: Open New ─── */
function openModal() {
    document.getElementById('modalTitle').textContent = 'New Habit';
    document.getElementById('habitForm').reset();
    document.getElementById('editHabitId').value = '';
    document.getElementById('habitCategory').value = 'general';
    document.getElementById('habitTags').value = '';
    document.getElementById('habitSubmitBtn').textContent = 'Save Habit';
    selectIcon('fitness', document.querySelector('.icon-option[data-icon="fitness"]'));
    document.getElementById('habitModal').classList.add('open');
}

/* ─── Modal: Open Edit ─── */
function openEditModal(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    document.getElementById('modalTitle').textContent = 'Edit Habit';
    document.getElementById('editHabitId').value = id;
    document.getElementById('habitTitle').value = habit.title;
    document.getElementById('habitDesc').value = habit.description || '';
    document.getElementById('habitFreq').value = habit.frequency;
    document.getElementById('habitCategory').value = habit.category || 'general';
    document.getElementById('habitTags').value = habit.tags || '';
    document.getElementById('habitSubmitBtn').textContent = 'Update Habit';

    // Set icon
    const iconEl = document.querySelector(`.icon-option[data-icon="${habit.icon}"]`);
    if (iconEl) selectIcon(habit.icon, iconEl);

    document.getElementById('habitModal').classList.add('open');
}

/* ─── Modal: Close ─── */
function closeModal() {
    document.getElementById('habitModal').classList.remove('open');
}

/* ─── Icon Selection ─── */
function selectIcon(icon, el) {
    selectedIcon = icon;
    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
    if (el) el.classList.add('selected');
}

/* ─── Habit Form Submit ─── */
async function handleHabitSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById('editHabitId').value;
    const title = document.getElementById('habitTitle').value.trim();
    const description = document.getElementById('habitDesc').value.trim();
    const frequency = document.getElementById('habitFreq').value;
    const category = (document.getElementById('habitCategory').value || 'general').trim().toLowerCase();
    const tags = (document.getElementById('habitTags').value || '').trim().toLowerCase();

    const submitBtn = document.getElementById('habitSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
        const payload = { title, description, frequency, icon: selectedIcon, category, tags };

        if (editId) {
            await apiFetch(`/habits/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Habit updated!', 'success');
        } else {
            await apiFetch('/habits', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Habit created!', 'success');
        }

        closeModal();
        await loadHabits();
        await loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editId ? 'Update Habit' : 'Save Habit';
    }
}

/* ─── Delete Modal ─── */
function openDeleteModal(id) {
    habitToDelete = id;
    document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
    habitToDelete = null;
    document.getElementById('deleteModal').classList.remove('open');
}

async function confirmDelete() {
    if (!habitToDelete) return;
    try {
        await apiFetch(`/habits/${habitToDelete}`, { method: 'DELETE' });
        showToast('Habit deleted', 'success');
        closeDeleteModal();
        await loadHabits();
        await loadStats();
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    }
}

function renderFocusStrip() {
    const progressBar = document.getElementById('dailyProgressBar');
    const progressText = document.getElementById('dailyProgressText');
    const focusMessage = document.getElementById('dailyFocusMessage');
    if (!progressBar || !progressText || !focusMessage) return;

    const total = habits.length;
    const done = habits.filter(h => h.completed_today).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${done} of ${total} habits completed today`;

    if (pct >= 100 && total > 0) {
        focusMessage.textContent = 'Perfect day. Protect your streak and review tomorrow plan.';
    } else if (pct >= 70) {
        focusMessage.textContent = 'Great progress. Finish one more habit to secure momentum.';
    } else if (pct > 0) {
        focusMessage.textContent = 'Strong start. Complete your easiest pending habit next.';
    } else {
        focusMessage.textContent = 'Start with one quick habit to gain momentum.';
    }
}

function renderHomeInsights() {
    const bestEl = document.getElementById('insightBestHabit');
    const attentionEl = document.getElementById('insightNeedsAttention');
    const hintEl = document.getElementById('insightCompletionHint');
    if (!bestEl || !attentionEl || !hintEl) return;

    if (habitStreaks.length) {
        const top = [...habitStreaks].sort((a, b) => b.streak - a.streak)[0];
        bestEl.textContent = `${top.title} (${top.streak} day${top.streak === 1 ? '' : 's'} streak)`;
    } else {
        bestEl.textContent = 'No streak data yet';
    }

    const pending = habits.filter(h => !h.completed_today);
    if (pending.length) {
        attentionEl.textContent = `${pending[0].title} is still pending today`;
    } else if (habits.length) {
        attentionEl.textContent = 'All habits completed for today';
    } else {
        attentionEl.textContent = 'Create a habit to get started';
    }

    const rate = statsSummary?.completionRate || 0;
    if (rate >= 80) {
        hintEl.textContent = 'Excellent 30-day consistency. Keep your schedule tight this week.';
    } else if (rate >= 50) {
        hintEl.textContent = 'You are building consistency. Try fixed times for each habit.';
    } else if (habits.length) {
        hintEl.textContent = 'Reduce friction: make each habit a 5-minute starter version.';
    } else {
        hintEl.textContent = 'Add your first habit and check in daily to build momentum.';
    }
}

function renderRecentWins() {
    const winsList = document.getElementById('recentWinsList');
    if (!winsList) return;

    const completed = habits.filter(h => h.completed_today).slice(0, 5);
    if (!completed.length) {
        winsList.innerHTML = '<p style="color:var(--text-muted);font-size:0.86rem;">No completed habits yet today. Complete one habit to see your wins.</p>';
        return;
    }

    winsList.innerHTML = completed.map(h => `
        <div class="win-item">
            <span class="win-item-title">${h.title}</span>
            <span class="badge badge-green">Completed</span>
        </div>
    `).join('');
}

async function createTemplateSet(templateName) {
    const templates = {
        wellness: [
            { title: 'Morning Stretch', frequency: 'daily', icon: 'fitness', category: 'health', tags: 'morning,mobility' },
            { title: 'Drink 2L Water', frequency: 'daily', icon: 'water', category: 'health', tags: 'hydration' },
            { title: 'Sleep Before 11 PM', frequency: 'daily', icon: 'sleep', category: 'recovery', tags: 'sleep,night' }
        ],
        productivity: [
            { title: 'Deep Work Session', frequency: 'daily', icon: 'study', category: 'career', tags: 'focus,work' },
            { title: 'Plan Tomorrow', frequency: 'daily', icon: 'general', category: 'planning', tags: 'planning,night' },
            { title: 'Read 20 Pages', frequency: 'daily', icon: 'study', category: 'learning', tags: 'reading,knowledge' }
        ],
        balanced: [
            { title: 'Walk 30 Minutes', frequency: 'daily', icon: 'fitness', category: 'health', tags: 'movement' },
            { title: 'Journal 10 Minutes', frequency: 'daily', icon: 'general', category: 'mindfulness', tags: 'journal,reflection' },
            { title: 'Learn One New Thing', frequency: 'daily', icon: 'study', category: 'growth', tags: 'learning' }
        ]
    };

    const set = templates[templateName];
    if (!set) return;

    try {
        for (const habit of set) {
            await apiFetch('/habits', {
                method: 'POST',
                body: JSON.stringify({
                    ...habit,
                    description: ''
                })
            });
        }

        localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
        showToast('Template habits added successfully', 'success');
        await loadHabits();
        await loadStats();
    } catch (err) {
        showToast('Failed to create templates: ' + err.message, 'error');
    }
}

/* ─── Close modals on overlay click ─── */
document.addEventListener('click', (e) => {
    if (e.target.id === 'habitModal') closeModal();
    if (e.target.id === 'deleteModal') closeDeleteModal();
});

/* ─── Close modal on Escape ─── */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDeleteModal();
    }
});
