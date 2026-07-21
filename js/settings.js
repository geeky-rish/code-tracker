/**
 * Placement Quest - Settings & Data Storage Engine
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
window.exportJSON = exportJSON;
window.importJSONFile = importJSONFile;
window.resetProgress = resetProgress;
