/**
 * Placement Quest - Daily Journal Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initJournal();
    }
  }, 50);
});

function initJournal() {
  renderJournalHistory();
}

function saveJournalEntry(e) {
  e.preventDefault();
  const learned = document.getElementById('journal-learned').value.trim();
  const mistake = document.getElementById('journal-mistake').value.trim();
  const focus = document.getElementById('journal-focus').value.trim();

  if (!learned && !mistake && !focus) {
    window.showToast('Please fill out at least one field!', 'danger', '⚠️');
    return;
  }

  const store = window.appStore;
  const todayStr = new Date().toISOString().split('T')[0];

  if (!store.progress.journal) store.progress.journal = [];

  // Check if entry for today already exists
  const existingIdx = store.progress.journal.findIndex(entry => entry.date === todayStr);
  const newEntry = { date: todayStr, learned, mistake, focus };

  if (existingIdx >= 0) {
    store.progress.journal[existingIdx] = newEntry;
  } else {
    store.progress.journal.unshift(newEntry);
  }

  store.saveAll();
  window.showToast("Daily Journal saved successfully!", "success", "📝");

  // Reset form & re-render timeline
  document.getElementById('journal-form').reset();
  renderJournalHistory();
}

function renderJournalHistory() {
  const store = window.appStore;
  const container = document.getElementById('journal-timeline');
  if (!container) return;

  const entries = store.progress.journal || [];

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; color: var(--text-muted); padding: 30px;">
        No journal entries logged yet. Record your daily reflection above!
      </div>
    `;
    return;
  }

  container.innerHTML = entries.map(entry => `
    <div class="journal-entry">
      <div class="journal-date">📅 Reflection for ${entry.date}</div>
      
      ${entry.learned ? `
        <div class="journal-section">
          <strong>Today I Learned:</strong>
          <p>${entry.learned}</p>
        </div>
      ` : ''}

      ${entry.mistake ? `
        <div class="journal-section">
          <strong>Biggest Mistake / Challenge:</strong>
          <p>${entry.mistake}</p>
        </div>
      ` : ''}

      ${entry.focus ? `
        <div class="journal-section">
          <strong>Tomorrow's Focus:</strong>
          <p>${entry.focus}</p>
        </div>
      ` : ''}
    </div>
  `).join('');
}

window.saveJournalEntry = saveJournalEntry;
