/**
 * Placement Quest - Pure Local Storage & Zero-Backend Engine
 * 100% Client-Side Static App
 * Saves progress entirely in local storage. Sync via manual JSON Export/Import.
 */

const STORAGE_KEYS = {
  ROADMAP: 'placement_quest_roadmap_v6',
  PROGRESS: 'placement_quest_progress_v6',
  ACHIEVEMENTS: 'placement_quest_achievements_v6',
  AUTH: 'placement_quest_auth_v6'
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
  }

  async init() {
    try {
      if (!this.checkAuthSession()) {
        this.redirectToLogin();
        return false;
      }

      // Load from Local Storage
      const cachedRoadmap = localStorage.getItem(STORAGE_KEYS.ROADMAP);
      const cachedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const cachedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);

      if (cachedRoadmap && cachedProgress && cachedAchievements) {
        this.roadmap = JSON.parse(cachedRoadmap);
        this.progress = JSON.parse(cachedProgress);
        this.achievements = JSON.parse(cachedAchievements);
      } else {
        // Fallback to initial local seed files (pristine template)
        await this.loadSeedData();
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
    this.saveAll();
  }

  // --- AUTH ---
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

  // --- SAVE ---
  saveAll() {
    localStorage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(this.roadmap));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));
  }

  // --- GAME LOGIC ---
  getLevelInfo(xp = (this.progress.user ? this.progress.user.xp : 0)) {
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
      version: 6,
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

  async importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.roadmap && data.progress && data.achievements) {
        this.roadmap = data.roadmap;
        this.progress = data.progress;
        this.achievements = data.achievements;
        this.saveAll();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.ROADMAP);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    location.reload();
  }
}

window.appStore = new Store();
