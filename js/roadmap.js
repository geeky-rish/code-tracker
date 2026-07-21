/**
 * Placement Quest - Roadmap & Problems List Engine (MongoDB API)
 */

let currentFilter = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initRoadmap();
    }
  }, 50);
});

function initRoadmap() {
  setupFilterTabs();
  setupSearchInput();
  renderRoadmapList();
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderRoadmapList();
    });
  });
}

function setupSearchInput() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderRoadmapList();
    });
  }
}

function renderRoadmapList() {
  const store = window.appStore;
  const container = document.getElementById('roadmap-list');
  if (!container) return;

  let problems = store.roadmap;

  if (currentFilter === 'core') {
    problems = problems.filter(p => p.isCore);
  } else if (currentFilter === 'phase1') {
    problems = problems.filter(p => p.phase.includes('Phase 1'));
  } else if (currentFilter === 'phase2') {
    problems = problems.filter(p => p.phase.includes('Phase 2'));
  } else if (currentFilter === 'phase3') {
    problems = problems.filter(p => p.phase.includes('Phase 3'));
  } else if (currentFilter === 'phase4') {
    problems = problems.filter(p => p.phase.includes('Phase 4'));
  } else if (currentFilter === 'completed') {
    problems = problems.filter(p => p.status === 'completed');
  }

  if (currentSearch) {
    problems = problems.filter(p => 
      p.title.toLowerCase().includes(currentSearch) ||
      p.pattern.toLowerCase().includes(currentSearch) ||
      p.keyPattern.toLowerCase().includes(currentSearch) ||
      (p.notes && p.notes.toLowerCase().includes(currentSearch))
    );
  }

  if (problems.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
        No problems match your current search or filter criteria.
      </div>
    `;
    return;
  }

  container.innerHTML = problems.map(p => {
    const isSolved = p.status === 'completed';
    const diffClass = p.difficulty.toLowerCase();
    
    return `
      <div class="problem-card ${isSolved ? 'solved' : ''}" id="problem-card-${p.id}">
        <div class="problem-meta">
          <div class="custom-checkbox ${isSolved ? 'checked' : ''}" 
               onclick="toggleProblemSolved(${p.id})"></div>
          <div class="problem-num">#${p.id}</div>
          <div class="problem-info">
            <div style="display: flex; align-items: center; gap: 8px;">
              <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="problem-title-link">
                ${p.isCore ? '🎯 ' : ''}${p.title}
                <span style="font-size:0.75rem; opacity:0.6;">↗</span>
              </a>
              <span class="badge-diff ${diffClass}">${p.difficulty}</span>
              ${p.isCore ? '<span class="badge-core">Core OA Target</span>' : ''}
            </div>
            <div class="problem-pattern">
              <strong>${p.pattern}</strong> • ${p.keyPattern}
            </div>
          </div>
        </div>

        <div class="problem-actions">
          <div class="problem-xp">+${p.xp} XP</div>
          <button class="notes-btn" onclick="toggleNotesEditor(${p.id})">
            📝 ${p.notes ? 'Edit Note' : 'Add Note'}
          </button>
        </div>
      </div>
      <div id="notes-editor-${p.id}" class="card" style="display: none; margin-top: -6px; margin-bottom: 12px; background: rgba(15, 23, 42, 0.9);">
        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 8px;">
          Note for #${p.id} ${p.title} (Pattern & Complexity):
        </div>
        <textarea id="notes-text-${p.id}" class="form-control" placeholder="e.g. prefix sum + hashmap, track running sum, O(n) time O(n) space">${p.notes || ''}</textarea>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
          <button class="btn btn-outline" onclick="toggleNotesEditor(${p.id})">Cancel</button>
          <button class="btn btn-primary" onclick="saveProblemNote(${p.id})">Save Note</button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleProblemSolved(problemId) {
  const store = window.appStore;
  const res = await store.toggleProblemStatus(problemId);
  
  if (!res) return;

  if (res.problem.status === 'completed') {
    window.showToast(`Solved: ${res.problem.title} (+${res.problem.xp} XP)`, 'success', '🎯');
    if (res.xpResult && res.xpResult.leveledUp) {
      window.showLevelUpModal(res.xpResult.newLevel);
    }
  }

  window.renderNavbar();
  renderRoadmapList();
}

function toggleNotesEditor(problemId) {
  const elem = document.getElementById(`notes-editor-${problemId}`);
  if (elem) {
    elem.style.display = elem.style.display === 'none' ? 'block' : 'none';
  }
}

async function saveProblemNote(problemId) {
  const textElem = document.getElementById(`notes-text-${problemId}`);
  if (!textElem) return;

  const notesText = textElem.value.trim();
  await window.appStore.toggleProblemStatus(problemId, null, notesText);
  window.showToast(`Saved note for problem #${problemId}`, 'success', '📝');
  
  toggleNotesEditor(problemId);
  renderRoadmapList();
}

window.toggleProblemSolved = toggleProblemSolved;
window.toggleNotesEditor = toggleNotesEditor;
window.saveProblemNote = saveProblemNote;
