/**
 * Placement Quest - Analytics & Statistics Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initStats();
    }
  }, 50);
});

function initStats() {
  const store = window.appStore;
  const roadmap = store.roadmap;
  const user = store.progress.user;

  // Breakdown by difficulty
  const easyTotal = roadmap.filter(p => p.difficulty === 'Easy').length;
  const easySolved = roadmap.filter(p => p.difficulty === 'Easy' && p.status === 'completed').length;

  const medTotal = roadmap.filter(p => p.difficulty === 'Medium').length;
  const medSolved = roadmap.filter(p => p.difficulty === 'Medium' && p.status === 'completed').length;

  const hardTotal = roadmap.filter(p => p.difficulty === 'Hard').length;
  const hardSolved = roadmap.filter(p => p.difficulty === 'Hard' && p.status === 'completed').length;

  const totalSolved = roadmap.filter(p => p.status === 'completed').length;
  const totalPct = Math.round((totalSolved / roadmap.length) * 100);

  // Render Overview Cards
  const statsOverviewElem = document.getElementById('stats-overview');
  if (statsOverviewElem) {
    statsOverviewElem.innerHTML = `
      <div class="card">
        <div class="card-title">Easy Problems</div>
        <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--emerald);">${easySolved} / ${easyTotal}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${Math.round((easySolved/easyTotal)*100 || 0)}% Completed</div>
      </div>

      <div class="card">
        <div class="card-title">Medium Problems</div>
        <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--amber);">${medSolved} / ${medTotal}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${Math.round((medSolved/medTotal)*100 || 0)}% Completed</div>
      </div>

      <div class="card">
        <div class="card-title">Total Progress</div>
        <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--primary);">${totalSolved} / ${roadmap.length}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${totalPct}% Overall Hit List</div>
      </div>

      <div class="card">
        <div class="card-title">Streak Record</div>
        <div style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; color: var(--rose);">🔥 ${user.currentStreak || 1} Days</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Longest: ${user.longestStreak || 1} Days</div>
      </div>
    `;
  }

  // Render Pattern Mastery Breakdown
  const patternMasteryElem = document.getElementById('pattern-mastery-list');
  if (patternMasteryElem) {
    const patternsMap = {};
    roadmap.forEach(p => {
      if (!patternsMap[p.pattern]) patternsMap[p.pattern] = { total: 0, solved: 0 };
      patternsMap[p.pattern].total += 1;
      if (p.status === 'completed') patternsMap[p.pattern].solved += 1;
    });

    patternMasteryElem.innerHTML = Object.keys(patternsMap).map(patName => {
      const data = patternsMap[patName];
      const pct = Math.round((data.solved / data.total) * 100);
      return `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.9rem;">
            <span><strong>${patName}</strong> (${data.solved}/${data.total})</span>
            <span style="font-family: var(--font-mono); font-weight: 600; color: var(--primary);">${pct}%</span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, var(--primary), var(--emerald)); border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}
