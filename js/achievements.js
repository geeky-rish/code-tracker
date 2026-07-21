/**
 * Placement Quest - Achievements & Trophies Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initAchievements();
    }
  }, 50);
});

function initAchievements() {
  window.appStore.checkAchievements();
  renderAchievementsGrid();
}

function renderAchievementsGrid() {
  const store = window.appStore;
  const container = document.getElementById('achievements-grid');
  if (!container) return;

  const achs = store.achievements;
  const unlockedCount = achs.filter(a => a.unlocked).length;

  const headerStatsElem = document.getElementById('achievements-stats');
  if (headerStatsElem) {
    headerStatsElem.innerHTML = `
      <div style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--text-main);">
        Trophies Unlocked: <span style="color: var(--emerald);">${unlockedCount} / ${achs.length}</span>
      </div>
    `;
  }

  container.innerHTML = achs.map(ach => `
    <div class="achievement-card ${ach.unlocked ? 'unlocked' : ''}">
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-info">
        <h3>${ach.title}</h3>
        <p>${ach.description}</p>
        ${ach.unlocked 
          ? `<div class="achievement-date">✓ Unlocked on ${ach.unlockedAt || 'Today'}</div>` 
          : `<div style="font-size: 0.72rem; color: var(--text-dim); margin-top: 8px;">🔒 Locked</div>`}
      </div>
    </div>
  `).join('');
}
