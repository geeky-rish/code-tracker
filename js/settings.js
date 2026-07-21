/**
 * Placement Quest - Settings Engine (Pure Local Storage)
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
  
  const xp = parseInt(document.getElementById('goal-xp').value, 10) || 150;
  const prob = parseInt(document.getElementById('goal-problems').value, 10) || 3;
  const hrs = parseFloat(document.getElementById('goal-hours').value) || 3;

  const success = store.saveGoals(xp, prob, hrs);
  if (success) {
    window.showToast("Daily goals updated locally!", "success", "⚙️");
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
window.exportJSON = exportJSON;
window.importJSONFile = importJSONFile;
window.resetProgress = resetProgress;
