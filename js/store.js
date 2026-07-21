/**
 * Placement Quest - Core Storage, State & GitHub API Sync Engine
 */

const STORAGE_KEYS = {
  ROADMAP: 'placement_quest_roadmap_v1',
  PROGRESS: 'placement_quest_progress_v1',
  ACHIEVEMENTS: 'placement_quest_achievements_v1',
  AUTH: 'placement_quest_auth_v1',
  GITHUB_CONFIG: 'placement_quest_github_v1'
};

// Password Hash for 'Rish@tgg17' (SHA-256)
const AUTH_CONFIG = {
  username: "thegeeksguy",
  // SHA-256 hash of 'Rish@tgg17'
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
    this.progress = {};
    this.achievements = [];
    this.isInitialized = false;
    this.githubConfig = {
      token: "",
      repo: "geeky-rish/code-tracker",
      branch: "main"
    };
  }

  async init() {
    try {
      // 1. Check Auth state
      if (!this.checkAuthSession()) {
        this.redirectToLogin();
        return false;
      }

      // 2. Load GitHub API config if present
      const savedGh = localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
      if (savedGh) {
        this.githubConfig = JSON.parse(savedGh);
      }

      // 3. If GitHub PAT is present, fetch remote files from GitHub API first!
      let remoteLoaded = false;
      if (this.githubConfig.token && this.githubConfig.repo) {
        remoteLoaded = await this.syncFromGitHubRemote();
      }

      if (!remoteLoaded) {
        // Fallback to localStorage or local /data/*.json files
        const cachedRoadmap = localStorage.getItem(STORAGE_KEYS.ROADMAP);
        const cachedProgress = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        const cachedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);

        if (cachedRoadmap && cachedProgress && cachedAchievements) {
          this.roadmap = JSON.parse(cachedRoadmap);
          this.progress = JSON.parse(cachedProgress);
          this.achievements = JSON.parse(cachedAchievements);
        } else {
          // Seed from JSON files in /data/
          const [rRes, pRes, aRes] = await Promise.all([
            fetch('./data/roadmap.json'),
            fetch('./data/progress.json'),
            fetch('./data/achievements.json')
          ]);

          this.roadmap = await rRes.json();
          this.progress = await pRes.json();
          this.achievements = await aRes.json();

          this.saveAll(false);
        }
      }

      this.updateStreak();
      this.isInitialized = true;
      return true;
    } catch (err) {
      console.error("Failed to initialize store:", err);
      return false;
    }
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

  // --- SAVE & GITHUB API SYNC ---
  saveAll(triggerGitHubPush = true) {
    localStorage.setItem(STORAGE_KEYS.ROADMAP, JSON.stringify(this.roadmap));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(this.achievements));

    if (triggerGitHubPush && this.githubConfig.token && this.githubConfig.repo) {
      // Debounced push to GitHub API
      clearTimeout(this._ghPushTimer);
      this._ghPushTimer = setTimeout(() => {
        this.pushToGitHubRemote();
      }, 1200);
    }
  }

  saveGitHubConfig(token, repo = "geeky-rish/code-tracker", branch = "main") {
    this.githubConfig = { token: token.trim(), repo: repo.trim(), branch: branch.trim() };
    localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify(this.githubConfig));
    return this.syncFromGitHubRemote();
  }

  async syncFromGitHubRemote() {
    if (!this.githubConfig.token || !this.githubConfig.repo) return false;
    try {
      const headers = {
        'Authorization': `token ${this.githubConfig.token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const repo = this.githubConfig.repo;
      const branch = this.githubConfig.branch || 'main';

      const [rRes, pRes, aRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repo}/contents/data/roadmap.json?ref=${branch}`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/contents/data/progress.json?ref=${branch}`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/contents/data/achievements.json?ref=${branch}`, { headers })
      ]);

      if (rRes.ok && pRes.ok && aRes.ok) {
        const [rData, pData, aData] = await Promise.all([rRes.json(), pRes.json(), aRes.json()]);

        this.roadmap = JSON.parse(decodeURIComponent(escape(atob(rData.content))));
        this.progress = JSON.parse(decodeURIComponent(escape(atob(pData.content))));
        this.achievements = JSON.parse(decodeURIComponent(escape(atob(aData.content))));

        // Save SHA for updates
        this._shas = {
          roadmap: rData.sha,
          progress: pData.sha,
          achievements: aData.sha
        };

        this.saveAll(false);
        return true;
      }
      return false;
    } catch (e) {
      console.warn("GitHub API sync failed, using localStorage fallback:", e);
      return false;
    }
  }

  async pushToGitHubRemote() {
    if (!this.githubConfig.token || !this.githubConfig.repo) return;

    try {
      const headers = {
        'Authorization': `token ${this.githubConfig.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      const repo = this.githubConfig.repo;
      const branch = this.githubConfig.branch || 'main';

      const pushFile = async (path, contentObj, shaKey) => {
        // Fetch current SHA if missing
        let sha = this._shas ? this._shas[shaKey] : null;
        if (!sha) {
          const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, { headers });
          if (getRes.ok) {
            const getData = await getRes.json();
            sha = getData.sha;
          }
        }

        const jsonStr = JSON.stringify(contentObj, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(jsonStr)));

        const body = {
          message: `auto-sync: update ${path} via Placement Quest App`,
          content: encodedContent,
          branch: branch
        };
        if (sha) body.sha = sha;

        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body)
        });

        if (putRes.ok) {
          const putData = await putRes.json();
          if (!this._shas) this._shas = {};
          this._shas[shaKey] = putData.content.sha;
        }
      };

      await Promise.all([
        pushFile('data/roadmap.json', this.roadmap, 'roadmap'),
        pushFile('data/progress.json', this.progress, 'progress'),
        pushFile('data/achievements.json', this.achievements, 'achievements')
      ]);

      if (window.showToast) {
        window.showToast("☁️ Auto-synced to GitHub repository!", "success", "GitHub");
      }
    } catch (e) {
      console.error("Failed pushing to GitHub API:", e);
    }
  }

  // --- GAME LOGIC ---
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
      version: 1,
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
    localStorage.removeItem(STORAGE_KEYS.GITHUB_CONFIG);
    location.reload();
  }
}

window.appStore = new Store();
