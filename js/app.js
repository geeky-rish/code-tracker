/**
 * Placement Quest - Core App UI Component & Toast Manager
 */

const MOTIVATIONAL_QUOTES = [
  { quote: "Discipline compounds.", author: "Placement Quest" },
  { quote: "Every solved problem is one less surprise in the interview.", author: "Infosys OA Strategy" },
  { quote: "Consistency beats intensity.", author: "Software Engineering Core" },
  { quote: "Blank editor, zero help — that is where true mastery begins.", author: "Infosys Hit List Rule" },
  { quote: "The master has failed more times than the beginner has even tried.", author: "Code Master" },
  { quote: "Focus on understanding the pattern, not memorizing the syntax.", author: "Neetcode Principle" },
  { quote: "Your ₹10 LPA target is built problem by problem.", author: "Placement Goal" }
];

document.addEventListener('DOMContentLoaded', async () => {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  if (currentPath === 'login.html') return;

  const initialized = await window.appStore.init();
  if (initialized) {
    renderNavbar();
    renderMotivationalQuote();
  }
});

function renderNavbar() {
  const levelInfo = window.appStore.getLevelInfo();
  const streak = window.appStore.progress.user.currentStreak || 1;
  const xp = window.appStore.progress.user.xp || 0;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  const navHTML = `
    <div class="container nav-container">
      <a href="index.html" class="brand">
        <div class="brand-icon">⚔️</div>
        <div class="brand-title">Placement Quest</div>
      </a>
      
      <ul class="nav-links">
        <li><a href="index.html" class="nav-link ${currentPath === 'index.html' || currentPath === '' ? 'active' : ''}">📊 Dashboard</a></li>
        <li><a href="roadmap.html" class="nav-link ${currentPath === 'roadmap.html' ? 'active' : ''}">🗺️ Roadmap</a></li>
        <li><a href="achievements.html" class="nav-link ${currentPath === 'achievements.html' ? 'active' : ''}">🏆 Achievements</a></li>
        <li><a href="stats.html" class="nav-link ${currentPath === 'stats.html' ? 'active' : ''}">📈 Stats</a></li>
        <li><a href="patterns.html" class="nav-link ${currentPath === 'patterns.html' ? 'active' : ''}">📚 Patterns</a></li>
        <li><a href="journal.html" class="nav-link ${currentPath === 'journal.html' ? 'active' : ''}">📝 Journal</a></li>
        <li><a href="settings.html" class="nav-link ${currentPath === 'settings.html' ? 'active' : ''}">⚙️ Settings</a></li>
      </ul>

      <div class="nav-stats">
        <div class="stat-pill streak" title="Current Active Streak">🔥 ${streak} Days</div>
        <div class="stat-pill level" title="Current Level">Lvl ${levelInfo.level}</div>
        <div class="stat-pill xp" title="Total XP Earned">⚡ ${xp} XP</div>
        <button class="btn btn-outline" style="padding: 6px 10px; font-size: 0.78rem;" onclick="window.appStore.logout()" title="Logout">
          🔒 Logout
        </button>
      </div>
    </div>
  `;

  const navElem = document.getElementById('navbar');
  if (navElem) navElem.innerHTML = navHTML;
}

function showToast(message, type = 'success', icon = '⚡') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function showLevelUpModal(levelInfo) {
  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay active';
  modalOverlay.innerHTML = `
    <div class="modal-content">
      <div style="font-size: 3.5rem; margin-bottom: 12px;">🎉</div>
      <h2 style="font-family: var(--font-heading); font-size: 2rem; color: var(--emerald); margin-bottom: 8px;">LEVEL UP!</h2>
      <p style="font-size: 1.2rem; font-weight: 700; margin-bottom: 4px;">Level ${levelInfo.level}: ${levelInfo.title}</p>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">You have earned enough XP to reach the next tier of mastery!</p>
      <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Keep Crushing It 🔥</button>
    </div>
  `;
  document.body.appendChild(modalOverlay);
}

function renderMotivationalQuote() {
  const elem = document.getElementById('motivational-quote');
  if (!elem) return;

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const selected = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

  elem.innerHTML = `
    <div class="card quote-card">
      <div class="quote-text">"${selected.quote}"</div>
      <div class="quote-author">— ${selected.author}</div>
    </div>
  `;
}

window.renderNavbar = renderNavbar;
window.showToast = showToast;
window.showLevelUpModal = showLevelUpModal;
