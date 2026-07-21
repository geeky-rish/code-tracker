/**
 * Placement Quest - Pure GitHub Pages + MongoDB Atlas Data API Engine
 * 100% Client-Side Static App (Zero Backend Services)
 * Communicates directly with MongoDB Atlas via the Atlas HTTPS Data API
 */

const STORAGE_KEYS = {
  AUTH: 'placement_quest_auth_v4',
  LOCAL_DATA: 'placement_quest_local_cache_v4',
  MONGO_CONFIG: 'placement_quest_mongo_config_v4'
};

const AUTH_CONFIG = {
  username: "thegeeksguy",
  // SHA-256 hash of Rish@tgg17
  passwordHash: "6de0d5d33aa42bc136cf08b4abece78c47f0882a2f9f5d5c48c746d33cffa3a3"
};

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Novice Coder" },
  { level: 2, xp: 250, title: "Syntax Apprentice" },
  { level: 3, xp: 600, title: "Array Artisan" },
  { level: 4, xp: 1000, title: "Pointer Specialist" },
  { level: 5, xp: 1500, title: "Algorithm Warrior" },
  { level: 6, xp: 2100, title: "Greedy Tactician" },
  { level: 7, xp: 2800, title: "DP Gladiator" },
  { level: 8, xp: 3600, title: "Graph Architect" },
  { level: 9, xp: 4500, title: "System Strategist" },
  { level: 10, xp: 5500, title: "Placement Titan" }
];

class Store {
  constructor() {
    this.roadmap = [];
    this.progress = { user: {}, goals: {}, todayMission: { tasks: [] }, heatmap: {}, journal: [], bossBattles: [] };
    this.achievements = [];
    this.isInitialized = false;

    // MongoDB Data API Configuration
    this.mongoConfig = {
      apiKey: "",
      appId: "", // Atlas App Services App ID
      cluster: "Cluster0",
      database: "placement_quest",
      region: "ap-south-1" // Default AWS Region
    };
  }

  async init() {
    try {
      if (!this.checkAuthSession()) {
        this.redirectToLogin();
        return false;
      }

      // Load Config from localStorage
      const savedMongo = localStorage.getItem(STORAGE_KEYS.MONGO_CONFIG);
      if (savedMongo) {
        this.mongoConfig = JSON.parse(savedMongo);
      }

      // Pull latest from MongoDB Atlas if API Key is configured
      let syncSuccess = false;
      if (this.mongoConfig.apiKey && this.mongoConfig.appId) {
        syncSuccess = await this.syncFromMongoAtlas();
      }

      if (!syncSuccess) {
        // Fallback to local cache or fetch default JSON seed files
        const cached = localStorage.getItem(STORAGE_KEYS.LOCAL_DATA);
        if (cached) {
          const parsed = JSON.parse(cached);
          this.roadmap = parsed.roadmap;
          this.progress = parsed.progress;
          this.achievements = parsed.achievements;
        } else {
          await this.loadSeedData();
        }
      }

      this.updateStreak();
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error("Initialization failed:", err);
      return false;
    }
  }

  async loadSeedData() {
    const [rRes, pRes, aRes] = await Promise.all([
      fetch('./data/roadmap.json'),
      fetch('./data/progress.json'),
      fetch('./data/achievements.json')
    ]);

    this.roadmap = await rRes.json();
    this.progress = await pRes.json();
    this.achievements = await aRes.json();
    this.saveLocalCache();
  }

  saveLocalCache() {
    localStorage.setItem(STORAGE_KEYS.LOCAL_DATA, JSON.stringify({
      roadmap: this.roadmap,
      progress: this.progress,
      achievements: this.achievements
    }));
  }

  // --- AUTH SYSTEM ---
  checkAuthSession() {
    const authData = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!authData) return false;
    try {
      const parsed = JSON.parse(authData);
      return parsed.isAuthenticated === true && parsed.username === AUTH_CONFIG.username;
    } catch (e) {
      return false;
    }
  }

  async login(username, password) {
    if (username.trim().toLowerCase() !== AUTH_CONFIG.username.toLowerCase()) {
      return { success: false, message: "Invalid username!" };
    }

    const hash = await this.sha256(password);
    if (hash === AUTH_CONFIG.passwordHash) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({
        isAuthenticated: true,
        username: AUTH_CONFIG.username,
        loginTime: new Date().toISOString()
      }));
      return { success: true };
    } else {
      return { success: false, message: "Incorrect password!" };
    }
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    this.redirectToLogin();
  }

  redirectToLogin() {
    const currentPath = window.location.pathname.split('/').pop();
    if (currentPath !== 'login.html') {
      window.location.href = 'login.html';
    }
  }

  async sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // --- MONGODB ATLAS DATA API SYNC ---
  async saveMongoConfig(apiKey, appId, cluster, database, region) {
    this.mongoConfig = {
      apiKey: apiKey.trim(),
      appId: appId.trim(),
      cluster: cluster.trim() || "Cluster0",
      database: database.trim() || "placement_quest",
      region: region.trim() || "ap-south-1"
    };
    localStorage.setItem(STORAGE_KEYS.MONGO_CONFIG, JSON.stringify(this.mongoConfig));
    return await this.syncFromMongoAtlas();
  }

  getMongoHeaders() {
    return {
      'Content-Type': 'application/json',
      'Access-Control-Request-Headers': '*',
      'api-key': this.mongoConfig.apiKey
    };
  }

  getMongoBaseUrl() {
    // Atlas Data API endpoint format
    return `https://${this.mongoConfig.region}.aws.data.mongodb-api.com/app/${this.mongoConfig.appId}/endpoint/data/v1/action`;
  }

  async syncFromMongoAtlas() {
    if (!this.mongoConfig.apiKey || !this.mongoConfig.appId) return false;
    try {
      const url = this.getMongoBaseUrl();
      const headers = this.getMongoHeaders();
      const payload = {
        cluster: this.mongoConfig.cluster,
        database: this.mongoConfig.database,
        dataSource: this.mongoConfig.cluster
      };

      // Fetch user profile state document
      const progressRes = await fetch(`${url}/findOne`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          collection: "progress",
          filter: { username: AUTH_CONFIG.username }
        })
      });

      if (!progressRes.ok) return false;
      const progressData = await progressRes.json();

      if (progressData.document) {
        this.progress = progressData.document.data;
      } else {
        // Seed remote progress if not found
        await this.loadSeedData();
        await fetch(`${url}/insertOne`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...payload,
            collection: "progress",
            document: { username: AUTH_CONFIG.username, data: this.progress }
          })
        });
      }

      // Fetch roadmap state document
      const roadmapRes = await fetch(`${url}/findOne`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          collection: "roadmap",
          filter: { username: AUTH_CONFIG.username }
        })
      });

      if (roadmapRes.ok) {
        const roadmapData = await roadmapRes.json();
        if (roadmapData.document) {
          this.roadmap = roadmapData.document.data;
        } else {
          // Seed remote roadmap if not found
          await fetch(`${url}/insertOne`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...payload,
              collection: "roadmap",
              document: { username: AUTH_CONFIG.username, data: this.roadmap }
            })
          });
        }
      }

      // Fetch achievements document
      const achRes = await fetch(`${url}/findOne`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          collection: "achievements",
          filter: { username: AUTH_CONFIG.username }
        })
      });

      if (achRes.ok) {
        const achData = await achRes.json();
        if (achData.document) {
          this.achievements = achData.document.data;
        } else {
          // Seed remote achievements if not found
          await fetch(`${url}/insertOne`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...payload,
              collection: "achievements",
              document: { username: AUTH_CONFIG.username, data: this.achievements }
            })
          });
        }
      }

      this.saveLocalCache();
      return true;
    } catch (e) {
      console.error("Error syncing from MongoDB Atlas:", e);
      return false;
    }
  }

  async pushToMongoAtlas() {
    if (!this.mongoConfig.apiKey || !this.mongoConfig.appId) return;
    try {
      const url = this.getMongoBaseUrl();
      const headers = this.getMongoHeaders();
      const payload = {
        cluster: this.mongoConfig.cluster,
        database: this.mongoConfig.database,
        dataSource: this.mongoConfig.cluster
      };

      // Perform updates (updateOne upsert equivalent)
      const updateDoc = async (col, data) => {
        await fetch(`${url}/updateOne`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...payload,
            collection: col,
            filter: { username: AUTH_CONFIG.username },
            update: { $set: { data: data } },
            upsert: true
          })
        });
      };

      await Promise.all([
        updateDoc("progress", this.progress),
        updateDoc("roadmap", this.roadmap),
        updateDoc("achievements", this.achievements)
      ]);

      if (window.showToast) {
        window.showToast("🍃 MongoDB Atlas Real-Time Synced!", "success", "Atlas");
      }
    } catch (e) {
      console.error("Atlas push failed:", e);
    }
  }

  // --- GAME LOGIC ---
  saveAll(triggerPush = true) {
    this.saveLocalCache();
    if (triggerPush) {
      clearTimeout(this._dbPushTimer);
      this._dbPushTimer = setTimeout(() => {
        this.pushToMongoAtlas();
      }, 1000);
    }
  }

  getLevelInfo(xp = this.progress.user.xp) {
    let current = LEVEL_THRESHOLDS[0];
    let next = LEVEL_THRESHOLDS[1];

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp >= LEVEL_THRESHOLDS[i].xp) {
        current = LEVEL_THRESHOLDS[i];
        next = LEVEL_THRESHOLDS[i + 1] || { level: current.level + 1, xp: current.xp + 1000, title: "Legendary Architect" };
      }
    }

    const currentLevelXP = xp - current.xp;
    const requiredForNext = next.xp - current.xp;
    const percent = Math.min(100, Math.floor((currentLevelXP / requiredForNext) * 100));

    return {
      level: current.level,
      title: current.title,
      currentXP: xp,
      levelXP: currentLevelXP,
      nextXP: next.xp,
      requiredForNext,
      percent
    };
  }

  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.progress.user.lastActiveDate;

    if (!lastActive) {
      this.progress.user.lastActiveDate = today;
      this.progress.user.currentStreak = 1;
      this.progress.user.longestStreak = 1;
    } else if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        this.progress.user.currentStreak = (this.progress.user.currentStreak || 0) + 1;
        if (this.progress.user.currentStreak > (this.progress.user.longestStreak || 0)) {
          this.progress.user.longestStreak = this.progress.user.currentStreak;
        }
      } else {
        this.progress.user.currentStreak = 1;
      }
      this.progress.user.lastActiveDate = today;
    }
    this.saveAll();
  }

  addXP(amount, source = "Task") {
    const prevXP = this.progress.user.xp || 0;
    const newXP = prevXP + amount;
    this.progress.user.xp = newXP;

    const today = new Date().toISOString().split('T')[0];
    if (!this.progress.heatmap) this.progress.heatmap = {};
    if (!this.progress.heatmap[today]) {
      this.progress.heatmap[today] = { count: 0, xp: 0, hours: 0.5 };
    }
    this.progress.heatmap[today].xp += amount;

    const oldLevelInfo = this.getLevelInfo(prevXP);
    const newLevelInfo = this.getLevelInfo(newXP);

    this.progress.user.level = newLevelInfo.level;
    this.saveAll();

    this.checkAchievements();

    return {
      added: amount,
      totalXP: newXP,
      leveledUp: newLevelInfo.level > oldLevelInfo.level,
      newLevel: newLevelInfo
    };
  }

  toggleProblemStatus(problemId, status = null, notes = null) {
    const problem = this.roadmap.find(p => p.id === problemId);
    if (!problem) return null;

    const prevStatus = problem.status;
    const newStatus = status || (prevStatus === 'completed' ? 'not_started' : 'completed');
    problem.status = newStatus;
    
    if (notes !== null) {
      problem.notes = notes;
    }

    let xpResult = null;
    const today = new Date().toISOString().split('T')[0];

    if (prevStatus !== 'completed' && newStatus === 'completed') {
      xpResult = this.addXP(problem.xp, `Solved ${problem.title}`);
      if (!this.progress.heatmap[today]) {
        this.progress.heatmap[today] = { count: 0, xp: 0, hours: 0.5 };
      }
      this.progress.heatmap[today].count += 1;
      this.progress.heatmap[today].hours += 0.5;
    }

    this.saveAll();
    this.checkAchievements();
    return { problem, xpResult };
  }

  toggleMissionTask(taskId) {
    const task = this.progress.todayMission.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.completed = !task.completed;
    if (task.completed) {
      this.addXP(task.xp, `Completed ${task.title}`);
    }
    this.saveAll();
    return true;
  }

  saveJournalEntry(learned, mistake, focus) {
    const today = new Date().toISOString().split('T')[0];
    if (!this.progress.journal) this.progress.journal = [];

    const existingIdx = this.progress.journal.findIndex(j => j.date === today);
    const newEntry = { date: today, learned, mistake, focus };

    if (existingIdx >= 0) {
      this.progress.journal[existingIdx] = newEntry;
    } else {
      this.progress.journal.unshift(newEntry);
    }

    this.saveAll();
    return true;
  }

  triggerBossBattle() {
    const result = this.addXP(500, "Boss Battle Victory!");
    if (this.progress.bossBattles && this.progress.bossBattles.length > 0) {
      this.progress.bossBattles[0].status = 'completed';
    }

    const bossAch = this.achievements.find(a => a.id === 'boss_slayer');
    if (bossAch) {
      bossAch.unlocked = true;
      bossAch.unlockedAt = new Date().toISOString().split('T')[0];
    }

    this.saveAll();
    return result;
  }

  saveGoals(dailyXpGoal, problemsPerDay, studyHours) {
    this.progress.goals = { dailyXpGoal, problemsPerDay, studyHours };
    this.saveAll();
    return true;
  }

  checkAchievements() {
    const solvedCount = this.roadmap.filter(p => p.status === 'completed').length;
    const streak = this.progress.user.currentStreak || 0;
    const newlyUnlocked = [];

    const isPatternCompleted = (patternName) => {
      const patternProblems = this.roadmap.filter(p => p.pattern.toLowerCase().includes(patternName.toLowerCase()));
      if (patternProblems.length === 0) return false;
      return patternProblems.every(p => p.status === 'completed');
    };

    this.achievements.forEach(ach => {
      if (ach.unlocked) return;

      let shouldUnlock = false;

      if (ach.condition === 'solved_count >= 1' && solvedCount >= 1) shouldUnlock = true;
      if (ach.condition === 'solved_count >= 22' && solvedCount >= 22) shouldUnlock = true;
      if (ach.condition === 'solved_count >= 45' && solvedCount >= 45) shouldUnlock = true;
      if (ach.condition === 'streak >= 7' && streak >= 7) shouldUnlock = true;
      if (ach.condition.startsWith('pattern_completed:')) {
        const targetPattern = ach.condition.split(':')[1];
        if (isPatternCompleted(targetPattern)) shouldUnlock = true;
      }

      if (shouldUnlock) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString().split('T')[0];
        newlyUnlocked.push(ach);
      }
    });

    if (newlyUnlocked.length > 0) {
      this.saveAll();
    }
    return newlyUnlocked;
  }

  exportDataJSON() {
    const fullData = {
      version: 4,
      exportedAt: new Date().toISOString(),
      roadmap: this.roadmap,
      progress: this.progress,
      achievements: this.achievements
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placement-quest-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.appStore = new Store();
