/**
 * Placement Quest - Settings & GitHub API Sync Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
  const checkStore = setInterval(() => {
    if (window.appStore && window.appStore.isInitialized) {
      clearInterval(checkStore);
      initSettings();
    }
  }, 50);
});

function initSettings() {
  const store = window.appStore;
  const goals = store.progress.goals || { dailyXpGoal: 150, problemsPerDay: 3, studyHours: 3 };

  document.getElementById('goal-xp').value = goals.dailyXpGoal || 150;
  document.getElementById('goal-problems').value = goals.problemsPerDay || 3;
  document.getElementById('goal-hours').value = goals.studyHours || 3;

  // GitHub Sync fields
  const ghConfig = store.githubConfig || {};
  document.getElementById('gh-token').value = ghConfig.token || '';
  document.getElementById('gh-repo').value = ghConfig.repo || 'geeky-rish/code-tracker';
  document.getElementById('gh-branch').value = ghConfig.branch || 'main';

  updateGhStatus(!!ghConfig.token);
}

function saveGoals(e) {
  e.preventDefault();
  const store = window.appStore;
  
  store.progress.goals = {
    dailyXpGoal: parseInt(document.getElementById('goal-xp').value, 10) || 150,
    problemsPerDay: parseInt(document.getElementById('goal-problems').value, 10) || 3,
    studyHours: parseFloat(document.getElementById('goal-hours').value) || 3
  };

  store.saveAll();
  window.showToast("Daily goals updated successfully!", "success", "⚙️");
}

async function saveGitHubSync(e) {
  e.preventDefault();
  const token = document.getElementById('gh-token').value.trim();
  const repo = document.getElementById('gh-repo').value.trim();
  const branch = document.getElementById('gh-branch').value.trim();

  if (!token) {
    window.showToast("Please enter a valid GitHub Personal Access Token", "danger", "⚠️");
    return;
  }

  window.showToast("Testing GitHub API connection...", "info", "🔍");
  const success = await window.appStore.saveGitHubConfig(token, repo, branch);

  if (success) {
    updateGhStatus(true);
    window.showToast("☁️ Connected to GitHub API! Automatic cross-device sync active.", "success", "⚡");
  } else {
    updateGhStatus(false);
    window.showToast("Failed to sync with GitHub API. Check token permissions.", "danger", "❌");
  }
}

function updateGhStatus(isConnected) {
  const statusElem = document.getElementById('gh-status-badge');
  if (statusElem) {
    if (isConnected) {
      statusElem.innerHTML = `<span style="color: var(--emerald); font-weight: 700;">🟢 Active Sync</span>`;
    } else {
      statusElem.innerHTML = `<span style="color: var(--text-dim); font-weight: 600;">⚪ Disconnected</span>`;
    }
  }
}

function exportJSON() {
  window.appStore.exportDataJSON();
  window.showToast("Data exported as JSON file!", "success", "📥");
}

function importJSONFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const success = await window.appStore.importDataJSON(e.target.result);
    if (success) {
      window.showToast("Data imported successfully! Reloading...", "success", "📤");
      setTimeout(() => location.reload(), 1200);
    } else {
      window.showToast("Invalid JSON file format!", "danger", "❌");
    }
  };
  reader.readAsText(file);
}

function resetProgress() {
  if (confirm("Are you sure you want to reset ALL progress? This will clear your XP, streak, and problem checkboxes.")) {
    window.appStore.resetAllData();
  }
}

window.saveGoals = saveGoals;
window.saveGitHubSync = saveGitHubSync;
window.exportJSON = exportJSON;
window.importJSONFile = importJSONFile;
window.resetProgress = resetProgress;
