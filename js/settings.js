/**
 * Placement Quest - Settings Engine (MongoDB Data API)
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

  // MongoDB Atlas configuration inputs
  const mongo = store.mongoConfig || {};
  document.getElementById('mongo-apikey').value = mongo.apiKey || '';
  document.getElementById('mongo-appid').value = mongo.appId || '';
  document.getElementById('mongo-cluster').value = mongo.cluster || 'Cluster0';
  document.getElementById('mongo-database').value = mongo.database || 'placement_quest';
  document.getElementById('mongo-region').value = mongo.region || 'ap-south-1';

  updateMongoStatus(!!mongo.apiKey);
}

async function saveGoals(e) {
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

async function saveMongoSync(e) {
  e.preventDefault();
  const apiKey = document.getElementById('mongo-apikey').value.trim();
  const appId = document.getElementById('mongo-appid').value.trim();
  const cluster = document.getElementById('mongo-cluster').value.trim();
  const database = document.getElementById('mongo-database').value.trim();
  const region = document.getElementById('mongo-region').value.trim();

  if (!apiKey || !appId) {
    window.showToast("Please fill in both your Atlas API Key and App ID!", "danger", "⚠️");
    return;
  }

  window.showToast("Establishing connection to MongoDB Atlas...", "info", "🍃");
  const success = await window.appStore.saveMongoConfig(apiKey, appId, cluster, database, region);

  if (success) {
    updateMongoStatus(true);
    window.showToast("🍃 Connected to MongoDB Atlas! Data synced successfully.", "success", "⚡");
  } else {
    updateMongoStatus(false);
    window.showToast("Connection failed. Check API key permissions and App ID.", "danger", "❌");
  }
}

function updateMongoStatus(isConnected) {
  const statusElem = document.getElementById('mongo-status-badge');
  if (statusElem) {
    if (isConnected) {
      statusElem.innerHTML = `<span style="color: var(--emerald); font-weight: 700;">🟢 Connected to Atlas</span>`;
    } else {
      statusElem.innerHTML = `<span style="color: var(--text-dim); font-weight: 600;">⚪ Disconnected</span>`;
    }
  }
}

function exportJSON() {
  window.appStore.exportDataJSON();
  window.showToast("Data exported as JSON file!", "success", "📥");
}

window.saveGoals = saveGoals;
window.saveMongoSync = saveMongoSync;
window.exportJSON = exportJSON;
