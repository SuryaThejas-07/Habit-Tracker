/**
 * analytics.js – Analytics Dashboard
 * Fetches analytics data and renders Chart.js charts
 * Theme-aware: reads CSS custom properties at render time
 */

// ─── State ───
let currentPeriod = 7;
let dailyChart = null;
let progressChart = null;
let monthlyChart = null;
let weeklyChart = null;
let leaderboardChart = null;

let summaryCache = null;
let dailyCache = [];
let weeklyCache = [];
let streaksCache = [];

/**
 * Read a CSS custom property from the root element at call time.
 * This makes charts automatically adapt to light/dark theme.
 */
function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Apply Chart.js global defaults based on current theme */
function applyChartTheme() {
    const textColor = getCSSVar('--text-secondary') || '#64748b';
    const gridColor = getCSSVar('--chart-grid') || 'rgba(0,0,0,.06)';
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
}

/** Re-render all charts when theme changes */
function onThemeChange() {
    applyChartTheme();
    loadAllAnalytics();
}

// Listen for theme attribute mutations on <html>
new MutationObserver((mutations) => {
    mutations.forEach(m => {
        if (m.attributeName === 'data-theme') onThemeChange();
    });
}).observe(document.documentElement, { attributes: true });

applyChartTheme();

/* ─── On Load ─── */
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    await loadAllAnalytics();
});

/* ─── Period Selector ─── */
async function setPeriod(days) {
    currentPeriod = days;
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`period${days}`).classList.add('active');
    await loadAllAnalytics();
}

/* ─── Load All Analytics ─── */
async function loadAllAnalytics() {
    await Promise.allSettled([
        loadSummary(),
        loadDailyChart(),
        loadMonthlyChart(),
        loadWeeklyChart(),
        loadStreaks()
    ]);

    renderExecutiveInsights();
    renderRecommendations();
}

/* ─── Summary Stats ─── */
async function loadSummary() {
    try {
        const { summary } = await apiFetch('/analytics/summary');
        summaryCache = summary;
        document.getElementById('sTotalHabits').textContent = summary.totalHabits;
        document.getElementById('sToday').textContent = `${summary.completedToday}/${summary.totalHabits}`;
        document.getElementById('sBestStreak').textContent = `${summary.bestStreak} 🔥`;
        document.getElementById('sRate').textContent = `${summary.completionRate}%`;

        // Progress doughnut
        renderProgressChart(summary.completedToday, summary.totalHabits);
        document.getElementById('progCompleted').textContent = summary.completedToday;
        document.getElementById('progRemaining').textContent = Math.max(0, summary.totalHabits - summary.completedToday);
        const pct = summary.totalHabits > 0 ? Math.round((summary.completedToday / summary.totalHabits) * 100) : 0;
        document.getElementById('progressPercent').textContent = `${pct}%`;

        renderExecutiveInsights();
        renderRecommendations();
    } catch (err) {
        console.error('Summary error:', err);
    }
}

/* ─── Daily Bar Chart ─── */
async function loadDailyChart() {
    try {
        const { daily } = await apiFetch(`/analytics/daily?days=${currentPeriod}`);
        dailyCache = daily;
        const labels = daily.map(d => {
            const date = new Date(d.date + 'T00:00:00');
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const completed = daily.map(d => d.completed);
        const total = daily.map(d => d.total);

        const ctx = document.getElementById('dailyChart').getContext('2d');
        if (dailyChart) dailyChart.destroy();

        dailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Completed',
                        data: completed,
                        backgroundColor: getCSSVar('--accent'),
                        borderColor: getCSSVar('--accent'),
                        borderWidth: 0,
                        borderRadius: 5,
                    },
                    {
                        label: 'Total',
                        data: total,
                        backgroundColor: getCSSVar('--bg-muted'),
                        borderColor: 'transparent',
                        borderWidth: 0,
                        borderRadius: 5,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, padding: 16 } },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: getCSSVar('--chart-grid') },
                        ticks: { stepSize: 1, color: getCSSVar('--chart-text') }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: getCSSVar('--chart-text') }
                    }
                }
            }
        });

        renderRecentTimeline();
        renderExecutiveInsights();
        renderRecommendations();
    } catch (err) {
        console.error('Daily chart error:', err);
    }
}

/* ─── Progress Doughnut Chart ─── */
function renderProgressChart(completed, total) {
    const remaining = Math.max(0, total - completed);
    const ctx = document.getElementById('progressChart').getContext('2d');
    if (progressChart) progressChart.destroy();

    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: total === 0 ? [0, 1] : [completed, remaining],
                backgroundColor: [
                    getCSSVar('--success'),
                    getCSSVar('--bg-muted')
                ],
                borderColor: [
                    getCSSVar('--success'),
                    'transparent'
                ],
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: total > 0 }
            }
        }
    });
}

/* ─── Monthly Line Chart ─── */
async function loadMonthlyChart() {
    try {
        const { monthly } = await apiFetch('/analytics/monthly');
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        if (monthlyChart) monthlyChart.destroy();

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthly.map(m => m.month),
                datasets: [{
                    label: 'Completion Rate %',
                    data: monthly.map(m => m.rate),
                    borderColor: getCSSVar('--accent'),
                    backgroundColor: (context) => {
                        const ctx2 = context.chart.ctx;
                        const gradient = ctx2.createLinearGradient(0, 0, 0, 200);
                        const accent = getCSSVar('--accent');
                        gradient.addColorStop(0, accent + '40');
                        gradient.addColorStop(1, 'transparent');
                        return gradient;
                    },
                    borderWidth: 2,
                    pointBackgroundColor: getCSSVar('--accent'),
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.raw}% completion rate`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: v => v + '%', color: getCSSVar('--chart-text') },
                        grid: { color: getCSSVar('--chart-grid') }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: getCSSVar('--chart-text') }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Monthly chart error:', err);
    }
}

/* ─── Weekly Bar Chart ─── */
async function loadWeeklyChart() {
    try {
        const { weekly } = await apiFetch('/analytics/weekly');
        weeklyCache = weekly;
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        if (weeklyChart) weeklyChart.destroy();

        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weekly.map(w => w.week),
                datasets: [{
                    label: 'Completion Rate %',
                    data: weekly.map(w => w.rate),
                    backgroundColor: [
                        getCSSVar('--accent'),
                        getCSSVar('--info'),
                        getCSSVar('--success'),
                        getCSSVar('--warning')
                    ],
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: { label: ctx => ` ${ctx.raw}% completion` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: v => v + '%', color: getCSSVar('--chart-text') },
                        grid: { color: getCSSVar('--chart-grid') }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: getCSSVar('--chart-text') }
                    }
                }
            }
        });

        renderRecommendations();
    } catch (err) {
        console.error('Weekly chart error:', err);
    }
}

/* ─── Streaks List ─── */
async function loadStreaks() {
    const list = document.getElementById('streakList');
    try {
        const { streaks } = await apiFetch('/analytics/streaks');
        streaksCache = streaks;

        if (!streaks.length) {
            list.innerHTML = `
        <div class="empty-state" style="padding:2rem;">
          <div class="empty-state-icon">🎯</div>
          <h3>No habits to track yet</h3>
          <p>Add habits on the My Habits page to see your streaks here.</p>
        </div>
      `;
        renderLeaderboardChart();
        renderExecutiveInsights();
        renderRecommendations();
            return;
        }

        // Find max streak for scaling the bar
        const maxStreak = Math.max(...streaks.map(s => s.currentStreak), 1);

        list.innerHTML = streaks.map(s => {
            const barWidth = Math.max((s.currentStreak / maxStreak) * 100, 2);
            const iconSrc = (s.icon === 'general' || s.icon === 'default')
                ? 'assets/images/logo.png'
                : `assets/images/icons/${s.icon}.png`;
            return `
        <div class="streak-item">
          <div class="streak-item-icon">
            <img src="${iconSrc}" alt="${s.icon}" onerror="this.style.display='none'" />
          </div>
          <div class="streak-item-name">${s.title}</div>
          <div class="streak-bar-wrap">
            <div class="streak-bar">
              <div class="streak-bar-fill" style="width:${barWidth}%"></div>
            </div>
            <span class="streak-badge">🔥 ${s.currentStreak} day${s.currentStreak !== 1 ? 's' : ''}</span>
          </div>
          <div style="text-align:right;min-width:60px;">
            <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">${s.totalCompletions}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);">total</div>
          </div>
        </div>
      `;
        }).join('');

        renderLeaderboardChart();
        renderExecutiveInsights();
        renderRecommendations();
    } catch (err) {
        list.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:2rem;">Failed to load streaks</p>`;
        console.error('Streaks error:', err);
    }
}

function renderExecutiveInsights() {
    const activeDaysEl = document.getElementById('kpiActiveDays');
    const momentumEl = document.getElementById('kpiMomentum');
    const avgStreakEl = document.getElementById('kpiAvgStreak');
    const bestHabitEl = document.getElementById('kpiBestHabit');

    if (!activeDaysEl || !momentumEl || !avgStreakEl || !bestHabitEl) return;

    const activeDays = dailyCache.filter(d => d.completed > 0).length;
    activeDaysEl.textContent = `${activeDays}/${dailyCache.length || currentPeriod}`;

    const completedSeries = dailyCache.map(d => d.completed);
    momentumEl.textContent = getMomentumLabel(completedSeries);

    if (summaryCache) {
        avgStreakEl.textContent = `${summaryCache.averageStreak || 0} days`;
    } else {
        avgStreakEl.textContent = '--';
    }

    if (streaksCache.length) {
        const best = [...streaksCache].sort((a, b) => b.currentStreak - a.currentStreak)[0];
        bestHabitEl.textContent = best.title.length > 18 ? `${best.title.slice(0, 18)}...` : best.title;
    } else {
        bestHabitEl.textContent = '--';
    }
}

function getMomentumLabel(series) {
    if (!series || series.length < 4) return 'Steady';

    const half = Math.floor(series.length / 2);
    const oldSlice = series.slice(0, half);
    const recentSlice = series.slice(half);

    const oldAvg = oldSlice.reduce((sum, v) => sum + v, 0) / (oldSlice.length || 1);
    const recentAvg = recentSlice.reduce((sum, v) => sum + v, 0) / (recentSlice.length || 1);
    const delta = recentAvg - oldAvg;

    if (delta >= 0.8) return 'Rising';
    if (delta <= -0.8) return 'Cooling';
    return 'Steady';
}

function renderRecommendations() {
    const container = document.getElementById('recommendationList');
    if (!container) return;

    const recommendations = [];

    if (summaryCache) {
        if (summaryCache.completionRate < 50) {
            recommendations.push('Focus on 1-2 core habits this week to rebuild consistency.');
        } else if (summaryCache.completionRate >= 80) {
            recommendations.push('Excellent consistency. Consider adding one stretch habit.');
        }

        if (summaryCache.completedToday < summaryCache.totalHabits) {
            recommendations.push('You still have pending habits today. Finish one now to keep momentum.');
        }
    }

    if (weeklyCache.length) {
        const latestWeek = weeklyCache[weeklyCache.length - 1];
        if (latestWeek && latestWeek.rate < 60) {
            recommendations.push('Weekly rate is below 60%. Try scheduling habits at fixed times.');
        }
    }

    if (streaksCache.length) {
        const lowStreak = streaksCache.filter(s => s.currentStreak <= 1).length;
        if (lowStreak > 0) {
            recommendations.push(`Revive ${lowStreak} habit${lowStreak > 1 ? 's' : ''} with tiny 5-minute goals.`);
        }
    }

    if (!recommendations.length) {
        recommendations.push('Your dashboard looks healthy. Keep this cadence for another week.');
        recommendations.push('Review your top streak daily and protect it first.');
    }

    container.innerHTML = recommendations.slice(0, 4).map(item => `
        <div class="recommend-item">${item}</div>
    `).join('');
}

function renderRecentTimeline() {
    const timeline = document.getElementById('recentTimeline');
    if (!timeline) return;

    if (!dailyCache.length) {
        timeline.innerHTML = '<p style="color:var(--text-muted);">No activity data yet.</p>';
        return;
    }

    const latestDays = [...dailyCache].slice(-7).reverse();
    timeline.innerHTML = latestDays.map(day => {
        const date = new Date(`${day.date}T00:00:00`);
        const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const rate = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
        const statusClass = rate >= 80 ? 'excellent' : rate >= 50 ? 'good' : 'low';

        return `
            <div class="timeline-item">
                <div class="timeline-date">${formatted}</div>
                <div class="timeline-meta">
                    <span>${day.completed}/${day.total} done</span>
                    <span class="timeline-pill ${statusClass}">${rate}%</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderLeaderboardChart() {
    const canvas = document.getElementById('leaderboardChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (leaderboardChart) leaderboardChart.destroy();

    const ranked = [...streaksCache]
        .sort((a, b) => {
            if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak;
            return b.totalCompletions - a.totalCompletions;
        })
        .slice(0, 6);

    if (!ranked.length) {
        leaderboardChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No habits yet'],
                datasets: [{ label: 'Streak', data: [0], backgroundColor: getCSSVar('--bg-muted') }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { stepSize: 1, color: getCSSVar('--chart-text') } },
                    y: { ticks: { color: getCSSVar('--chart-text') } }
                }
            }
        });
        return;
    }

    leaderboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranked.map(s => s.title),
            datasets: [{
                label: 'Current Streak (days)',
                data: ranked.map(s => s.currentStreak),
                backgroundColor: ranked.map((_, i) => {
                    const palette = [
                        getCSSVar('--accent'),
                        getCSSVar('--success'),
                        getCSSVar('--info'),
                        getCSSVar('--warning'),
                        '#f97316',
                        '#10b981'
                    ];
                    return palette[i % palette.length];
                }),
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.raw} day${context.raw !== 1 ? 's' : ''}`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: getCSSVar('--chart-grid') },
                    ticks: { stepSize: 1, color: getCSSVar('--chart-text') }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: getCSSVar('--chart-text') }
                }
            }
        }
    });
}
