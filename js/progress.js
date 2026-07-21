/**
 * Placement Quest - Dashboard Logic Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for store initialization
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initDashboard();
    }
  }, 50);
});

function initDashboard() {
  renderHeroStats();
  renderTodayMission();
  renderBossBattle();
  renderHeatmap();
}

function renderHeroStats() {
  const store = window.appStore;
  const user = store.progress.user;
  const levelInfo = store.getLevelInfo();

  const totalProblems = store.roadmap.length;
  const solvedProblems = store.roadmap.filter(p => p.status === 'completed').length;
  const completionPct = Math.round((solvedProblems / totalProblems) * 100);

  // Target Date calculations (Aug 10, 2026)
  const today = new Date();
  const targetDate = new Date(user.targetDate || '2026-08-10');
  const diffTime = targetDate - today;
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Hero Grid Container
  const heroGridElem = document.getElementById('hero-grid');
  if (heroGridElem) {
    heroGridElem.innerHTML = `
      <div class="hero-stat-card">
        <div class="label">Level & Tier</div>
        <div class="value" style="color: var(--purple)">Lvl ${levelInfo.level}</div>
        <div class="subtext">${levelInfo.title}</div>
      </div>

      <div class="hero-stat-card">
        <div class="label">Current Streak</div>
        <div class="value" style="color: var(--amber)">🔥 ${user.currentStreak || 1} Days</div>
        <div class="subtext">Longest: ${user.longestStreak || 1} Days</div>
      </div>

      <div class="hero-stat-card">
        <div class="label">Problems Solved</div>
        <div class="value" style="color: var(--emerald)">${solvedProblems} / ${totalProblems}</div>
        <div class="subtext">${completionPct}% Total Completion</div>
      </div>

      <div class="hero-stat-card">
        <div class="label">Days Remaining</div>
        <div class="value" style="color: var(--primary)">⏳ ${daysRemaining} Days</div>
        <div class="subtext">Target: Aug 10 (Infosys OA)</div>
      </div>
    `;
  }

  // XP Banner
  const xpBannerElem = document.getElementById('xp-banner');
  if (xpBannerElem) {
    xpBannerElem.innerHTML = `
      <div class="xp-banner-info">
        <span>Level ${levelInfo.level} Progress</span>
        <span style="font-family: var(--font-mono); font-weight: 600; color: var(--emerald);">
          ${levelInfo.levelXP} / ${levelInfo.requiredForNext} XP (${levelInfo.percent}%)
        </span>
      </div>
      <div class="xp-track">
        <div class="xp-fill" style="width: ${levelInfo.percent}%;"></div>
      </div>
    `;
  }
}

function renderTodayMission() {
  const store = window.appStore;
  const missionContainer = document.getElementById('mission-list');
  if (!missionContainer) return;

  const tasks = store.progress.todayMission.tasks || [];

  missionContainer.innerHTML = tasks.map(task => `
    <div class="mission-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
      <div class="mission-left">
        <div class="custom-checkbox ${task.completed ? 'checked' : ''}" 
             onclick="toggleMissionTask('${task.id}')"></div>
        <div class="mission-title">${task.title}</div>
      </div>
      <div class="mission-xp">+${task.xp} XP</div>
    </div>
  `).join('');
}

function toggleMissionTask(taskId) {
  const store = window.appStore;
  const task = store.progress.todayMission.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;

  if (task.completed) {
    // Add XP
    const result = store.addXP(task.xp, `Completed ${task.title}`);
    window.showToast(`Completed: ${task.title} (+${task.xp} XP)`, 'success', '⚡');
    
    // Also if task corresponds to a roadmap problem, mark that problem solved!
    if (task.problemId) {
      store.toggleProblemStatus(task.problemId, 'completed');
    }

    if (result.leveledUp) {
      window.showLevelUpModal(result.newLevel);
    }
  } else {
    store.saveAll();
  }

  window.renderNavbar();
  renderHeroStats();
  renderTodayMission();
}

function renderBossBattle() {
  const store = window.appStore;
  const container = document.getElementById('boss-battle-container');
  if (!container) return;

  const currentBoss = store.progress.bossBattles[0] || {
    day: 5,
    title: "Phase 1 Boss Battle (3-Hour Mock)",
    description: "Solve 3 unseen array & hashing problems cold in 3 hours with blank editor.",
    xpReward: 500,
    status: "upcoming"
  };

  container.innerHTML = `
    <div class="card boss-card">
      <div class="boss-header">
        <span class="boss-badge">🔥 Boss Battle — Day ${currentBoss.day}</span>
      </div>
      <h2 class="boss-title">${currentBoss.title}</h2>
      <p class="boss-desc">${currentBoss.description}</p>
      <div class="boss-action">
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--amber);">
          Reward: +${currentBoss.xpReward} XP & Badge
        </span>
        <button class="btn btn-amber" onclick="triggerBossBattle()">
          ⚔️ Launch Mock Battle
        </button>
      </div>
    </div>
  `;
}

function triggerBossBattle() {
  const store = window.appStore;
  const result = store.addXP(500, "Boss Battle Victory!");
  
  // Mark boss battle completed & unlock achievement
  if (store.progress.bossBattles[0]) {
    store.progress.bossBattles[0].status = "completed";
  }
  
  // Check boss slayer achievement
  const bossAch = store.achievements.find(a => a.id === 'boss_slayer');
  if (bossAch) {
    bossAch.unlocked = true;
    bossAch.unlockedAt = new Date().toISOString().split('T')[0];
  }
  store.saveAll();

  window.showToast("🔥 BOSS BATTLE DEFEATED! Earned +500 XP!", "success", "⚔️");
  if (result.leveledUp) {
    window.showLevelUpModal(result.newLevel);
  }
  window.renderNavbar();
  renderHeroStats();
  renderBossBattle();
}

function renderHeatmap() {
  const store = window.appStore;
  const heatmapElem = document.getElementById('heatmap-grid');
  if (!heatmapElem) return;

  const heatmapData = store.progress.heatmap || {};
  const today = new Date();
  
  // Generate last 35 days (5 weeks x 7 days)
  let cellsHTML = '';
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const entry = heatmapData[dateStr] || { count: 0, xp: 0, hours: 0 };
    
    let level = 0;
    if (entry.xp >= 150) level = 4;
    else if (entry.xp >= 100) level = 3;
    else if (entry.xp >= 50) level = 2;
    else if (entry.xp > 0 || entry.count > 0) level = 1;

    cellsHTML += `
      <div class="heatmap-cell" 
           data-level="${level}" 
           onmouseenter="showHeatmapTooltip(event, '${dateStr}', ${entry.count}, ${entry.xp}, ${entry.hours})"
           onmouseleave="hideHeatmapTooltip()"></div>
    `;
  }

  heatmapElem.innerHTML = cellsHTML;
}

function showHeatmapTooltip(e, date, count, xp, hours) {
  let tooltip = document.getElementById('heatmap-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'heatmap-tooltip';
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `
    <strong>${date}</strong><br/>
    Problems: ${count} | XP: ${xp}<br/>
    Study Hours: ${hours} hrs
  `;

  tooltip.style.display = 'block';
  tooltip.style.left = (e.pageX + 10) + 'px';
  tooltip.style.top = (e.pageY - 30) + 'px';
}

function hideHeatmapTooltip() {
  const tooltip = document.getElementById('heatmap-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

window.toggleMissionTask = toggleMissionTask;
window.triggerBossBattle = triggerBossBattle;
window.showHeatmapTooltip = showHeatmapTooltip;
window.hideHeatmapTooltip = hideHeatmapTooltip;
