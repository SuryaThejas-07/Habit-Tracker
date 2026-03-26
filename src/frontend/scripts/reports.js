document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());
    await loadReports();
});

async function loadReports() {
    try {
        const [summaryRes, monthlyRes, streakRes] = await Promise.all([
            apiFetch('/analytics/summary'),
            apiFetch('/analytics/monthly'),
            apiFetch('/analytics/streaks')
        ]);

        renderReportSummary(summaryRes.summary);
        renderAchievements(summaryRes.summary, streakRes.streaks || []);
        renderImprovements(summaryRes.summary, monthlyRes.monthly || [], streakRes.streaks || []);
        renderMonthlyTable(monthlyRes.monthly || []);
        renderStreakRanking(streakRes.streaks || []);
    } catch (err) {
        showToast('Failed to load reports: ' + err.message, 'error');
    }
}

function renderReportSummary(summary) {
    document.getElementById('reportTotalHabits').textContent = String(summary.totalHabits);
    document.getElementById('reportCompletionRate').textContent = `${summary.completionRate}%`;
    document.getElementById('reportBestStreak').textContent = `${summary.bestStreak} days`;
}

function renderAchievements(summary, streaks) {
    const list = document.getElementById('achievementList');
    const items = [];

    if (summary.completionRate >= 80) {
        items.push('Consistency Champion: 80%+ completion rate over the last 30 days.');
    }

    if (summary.bestStreak >= 7) {
        items.push(`Streak Builder: reached a ${summary.bestStreak}-day streak.`);
    }

    if (summary.completedToday === summary.totalHabits && summary.totalHabits > 0) {
        items.push('Perfect Day: all habits completed today.');
    }

    if (!items.length && streaks.length) {
        items.push('Good progress underway. Keep showing up daily to unlock milestones.');
    }

    if (!items.length) {
        items.push('No achievements yet. Add habits and complete them to unlock achievements.');
    }

    list.innerHTML = items.map(item => `<div class="recommend-item">${item}</div>`).join('');
}

function renderImprovements(summary, monthly, streaks) {
    const list = document.getElementById('improvementList');
    const items = [];

    if (summary.completionRate < 60) {
        items.push('Completion rate is under 60%. Reduce habit difficulty and build a daily baseline.');
    }

    const latestMonth = monthly[monthly.length - 1];
    if (latestMonth && latestMonth.rate < 50) {
        items.push(`Latest monthly rate is ${latestMonth.rate}%. Consider setting fixed habit time slots.`);
    }

    const lowStreakHabits = streaks.filter(s => s.currentStreak <= 1).length;
    if (lowStreakHabits > 0) {
        items.push(`${lowStreakHabits} habit(s) have weak streaks. Start with 5-minute versions for consistency.`);
    }

    if (!items.length) {
        items.push('No major concerns detected. Maintain your current rhythm and review weekly.');
    }

    list.innerHTML = items.map(item => `<div class="recommend-item">${item}</div>`).join('');
}

function renderMonthlyTable(monthly) {
    const tbody = document.querySelector('#monthlyReportTable tbody');
    if (!tbody) return;

    if (!monthly.length) {
        tbody.innerHTML = '<tr><td colspan="4">No monthly data available.</td></tr>';
        return;
    }

    tbody.innerHTML = monthly.map(row => `
        <tr>
            <td>${row.month}</td>
            <td>${row.completed}</td>
            <td>${row.possible}</td>
            <td>${row.rate}%</td>
        </tr>
    `).join('');
}

function renderStreakRanking(streaks) {
    const container = document.getElementById('reportStreakRanking');
    if (!container) return;

    if (!streaks.length) {
        container.innerHTML = '<p style="color:var(--text-muted);">No streak data available.</p>';
        return;
    }

    const ranked = [...streaks].sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 6);
    const maxStreak = Math.max(...ranked.map(s => s.currentStreak), 1);

    container.innerHTML = ranked.map(item => {
        const width = Math.max((item.currentStreak / maxStreak) * 100, 2);
        const iconSrc = (item.icon === 'general' || item.icon === 'default')
            ? 'assets/images/logo.png'
            : `assets/images/icons/${item.icon}.png`;
        return `
            <div class="streak-item">
                <div class="streak-item-icon">
                    <img src="${iconSrc}" alt="${item.icon}" onerror="this.style.display='none'" />
                </div>
                <div class="streak-item-name">${item.title}</div>
                <div class="streak-bar-wrap">
                    <div class="streak-bar">
                        <div class="streak-bar-fill" style="width:${width}%"></div>
                    </div>
                    <span class="streak-badge">🔥 ${item.currentStreak} day${item.currentStreak === 1 ? '' : 's'}</span>
                </div>
            </div>
        `;
    }).join('');
}
