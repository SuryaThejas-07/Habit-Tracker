let plannerDate = new Date();
let plannerHabits = [];
let plannerCompletionMap = {};

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    bindPlannerControls();
    await loadPlannerData();
});

function bindPlannerControls() {
    document.getElementById('prevDayBtn')?.addEventListener('click', async () => {
        plannerDate.setDate(plannerDate.getDate() - 1);
        await loadPlannerData();
    });

    document.getElementById('nextDayBtn')?.addEventListener('click', async () => {
        plannerDate.setDate(plannerDate.getDate() + 1);
        await loadPlannerData();
    });

    document.getElementById('todayBtn')?.addEventListener('click', async () => {
        plannerDate = new Date();
        await loadPlannerData();
    });
}

function getPlannerDateKey() {
    return plannerDate.toISOString().slice(0, 10);
}

function formatPlannerDate() {
    return plannerDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function loadPlannerData() {
    try {
        document.getElementById('plannerDateValue').textContent = formatPlannerDate();

        const { habits } = await apiFetch('/habits');
        plannerHabits = habits;

        const targetDate = getPlannerDateKey();
        const completionMap = {};

        await Promise.all(plannerHabits.map(async (habit) => {
            try {
                const logsRes = await apiFetch(`/habits/${habit.id}/logs?startDate=${targetDate}&endDate=${targetDate}`);
                completionMap[habit.id] = Array.isArray(logsRes.logs) && logsRes.logs.some(log => log.date === targetDate);
            } catch {
                completionMap[habit.id] = false;
            }
        }));

        plannerCompletionMap = completionMap;
        renderPlannerStats();
        renderPlannerList();
    } catch (err) {
        showToast('Failed to load planner: ' + err.message, 'error');
        document.getElementById('plannerList').innerHTML = '<p style="color:var(--text-muted);">Unable to load planner data.</p>';
    }
}

function renderPlannerStats() {
    const total = plannerHabits.length;
    const completed = plannerHabits.filter(h => plannerCompletionMap[h.id]).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('plannerTotalHabits').textContent = String(total);
    document.getElementById('plannerCompletedHabits').textContent = String(completed);
    document.getElementById('plannerCompletionRate').textContent = `${rate}%`;
}

function renderPlannerList() {
    const list = document.getElementById('plannerList');
    if (!plannerHabits.length) {
        list.innerHTML = '<p style="color:var(--text-muted);">No habits found. Create habits from My Habits page.</p>';
        return;
    }

    list.innerHTML = plannerHabits.map(habit => {
        const isCompleted = !!plannerCompletionMap[habit.id];
        const iconSrc = (habit.icon === 'general' || habit.icon === 'default')
            ? 'assets/images/logo.png'
            : `assets/images/icons/${habit.icon}.png`;

        return `
            <div class="planner-item ${isCompleted ? 'done' : ''}">
                <div class="planner-item-main">
                    <div class="streak-item-icon">
                        <img src="${iconSrc}" alt="${habit.icon}" onerror="this.style.display='none'" />
                    </div>
                    <div>
                        <div class="planner-item-title">${habit.title}</div>
                        <div class="planner-item-meta">${habit.frequency}</div>
                    </div>
                </div>
                <button class="btn ${isCompleted ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="togglePlannerHabit(${habit.id})">
                    ${isCompleted ? 'Completed' : 'Mark Done'}
                </button>
            </div>
        `;
    }).join('');
}

async function togglePlannerHabit(habitId) {
    try {
        const targetDate = getPlannerDateKey();
        await apiFetch(`/habits/${habitId}/log`, {
            method: 'POST',
            body: JSON.stringify({ date: targetDate })
        });
        await loadPlannerData();
        showToast('Planner updated', 'success');
    } catch (err) {
        showToast('Failed to update planner: ' + err.message, 'error');
    }
}
