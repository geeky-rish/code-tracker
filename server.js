require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const RoadmapProblem = require('./models/RoadmapProblem');
const UserProblemState = require('./models/UserProblemState');
const Achievement = require('./models/Achievement');
const UserAchievementState = require('./models/UserAchievementState');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'placement_quest_secret';

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    await seedDatabase();
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Auth Middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.decode(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// LEVEL THRESHOLDS
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

function calcLevel(xp) {
  let current = LEVEL_THRESHOLDS[0];
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
    }
  }
  return current.level;
}

// AUTO-SEED DATABASE
async function seedDatabase() {
  try {
    // 1. Seed Roadmap Problems if empty
    const probCount = await RoadmapProblem.countDocuments();
    if (probCount === 0) {
      const rawRoadmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'roadmap.json'), 'utf-8'));
      await RoadmapProblem.insertMany(rawRoadmap.map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        pattern: p.pattern,
        xp: p.xp,
        phase: p.phase,
        targetDay: p.targetDay,
        isCore: p.isCore || false,
        url: p.url,
        keyPattern: p.keyPattern
      })));
      console.log('🌱 Seeded 45 Roadmap Problems into MongoDB');
    }

    // 2. Seed Achievements if empty
    const achCount = await Achievement.countDocuments();
    if (achCount === 0) {
      const rawAch = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'achievements.json'), 'utf-8'));
      await Achievement.insertMany(rawAch);
      console.log('🌱 Seeded Achievements into MongoDB');
    }

    // 3. Create or update user "thegeeksguy" with password "Rish@tgg17"
    let defaultUser = await User.findOne({ username: 'thegeeksguy' });
    if (!defaultUser) {
      const hashedPassword = await bcrypt.hash('Rish@tgg17', 10);
      const rawProgress = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'progress.json'), 'utf-8'));

      defaultUser = await User.create({
        username: 'thegeeksguy',
        password: hashedPassword,
        level: 1,
        xp: 0,
        currentStreak: 1,
        longestStreak: 1,
        goals: rawProgress.goals,
        todayMission: rawProgress.todayMission,
        heatmap: rawProgress.heatmap || {},
        journal: [],
        bossBattles: rawProgress.bossBattles
      });
      console.log('👤 Created default user "thegeeksguy" in MongoDB');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// --- API ROUTES ---

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.encode({ userId: user._id, username: user.username }, JWT_SECRET);
    res.json({ success: true, token, user: { username: user.username, level: user.level, xp: user.xp } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Dashboard Data Load
app.get('/api/data', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const roadmapProblems = await RoadmapProblem.find().sort({ id: 1 });
    const userProblemStates = await UserProblemState.find({ userId: user._id });
    const stateMap = {};
    userProblemStates.forEach(s => {
      stateMap[s.problemId] = { status: s.status, notes: s.notes };
    });

    const populatedRoadmap = roadmapProblems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      pattern: p.pattern,
      xp: p.xp,
      phase: p.phase,
      targetDay: p.targetDay,
      isCore: p.isCore,
      url: p.url,
      keyPattern: p.keyPattern,
      status: stateMap[p.id] ? stateMap[p.id].status : 'not_started',
      notes: stateMap[p.id] ? stateMap[p.id].notes : ''
    }));

    const achievements = await Achievement.find();
    const userAchStates = await UserAchievementState.find({ userId: user._id });
    const achStateMap = {};
    userAchStates.forEach(a => {
      achStateMap[a.achievementId] = { unlocked: a.unlocked, unlockedAt: a.unlockedAt };
    });

    const populatedAchievements = achievements.map(a => ({
      id: a.id,
      title: a.title,
      icon: a.icon,
      description: a.description,
      category: a.category,
      condition: a.condition,
      unlocked: achStateMap[a.id] ? achStateMap[a.id].unlocked : false,
      unlockedAt: achStateMap[a.id] ? achStateMap[a.id].unlockedAt : null
    }));

    res.json({
      user: {
        username: user.username,
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastActiveDate: user.lastActiveDate,
        startDate: user.startDate,
        targetDate: user.targetDate
      },
      goals: user.goals,
      todayMission: user.todayMission,
      heatmap: user.heatmap,
      journal: user.journal,
      bossBattles: user.bossBattles,
      roadmap: populatedRoadmap,
      achievements: populatedAchievements
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Problem Solved Status
app.post('/api/problem/toggle', authMiddleware, async (req, res) => {
  try {
    const { problemId, status, notes } = req.body;
    const user = await User.findById(req.userId);
    const problem = await RoadmapProblem.findOne({ id: problemId });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    let pState = await UserProblemState.findOne({ userId: user._id, problemId });
    if (!pState) {
      pState = new UserProblemState({ userId: user._id, problemId });
    }

    const prevStatus = pState.status;
    const newStatus = status || (prevStatus === 'completed' ? 'not_started' : 'completed');
    pState.status = newStatus;
    if (notes !== undefined) pState.notes = notes;
    if (newStatus === 'completed' && prevStatus !== 'completed') {
      pState.solvedAt = new Date();
    }
    await pState.save();

    let xpAdded = 0;
    const today = new Date().toISOString().split('T')[0];

    if (prevStatus !== 'completed' && newStatus === 'completed') {
      xpAdded = problem.xp;
      user.xp += xpAdded;
      user.level = calcLevel(user.xp);

      // Update Heatmap
      if (!user.heatmap) user.heatmap = new Map();
      const currentHeat = user.heatmap.get(today) || { count: 0, xp: 0, hours: 0 };
      currentHeat.count += 1;
      currentHeat.xp += xpAdded;
      currentHeat.hours += 0.5;
      user.heatmap.set(today, currentHeat);
      await user.save();
    }

    // Check Achievements in DB
    const allStates = await UserProblemState.find({ userId: user._id, status: 'completed' });
    const solvedCount = allStates.length;
    const achievements = await Achievement.find();

    for (let ach of achievements) {
      let unlock = false;
      if (ach.condition === 'solved_count >= 1' && solvedCount >= 1) unlock = true;
      if (ach.condition === 'solved_count >= 22' && solvedCount >= 22) unlock = true;
      if (ach.condition === 'solved_count >= 45' && solvedCount >= 45) unlock = true;
      if (ach.condition === 'streak >= 7' && user.currentStreak >= 7) unlock = true;

      if (unlock) {
        let uAch = await UserAchievementState.findOne({ userId: user._id, achievementId: ach.id });
        if (!uAch) {
          await UserAchievementState.create({
            userId: user._id,
            achievementId: ach.id,
            unlocked: true,
            unlockedAt: today
          });
        }
      }
    }

    res.json({ success: true, problemId, status: newStatus, xpAdded, userLevel: user.level, userXp: user.xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Today's Mission Task
app.post('/api/mission/toggle', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.body;
    const user = await User.findById(req.userId);

    const task = user.todayMission.tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.completed = !task.completed;
    if (task.completed) {
      user.xp += task.xp;
      user.level = calcLevel(user.xp);
    }
    await user.save();

    res.json({ success: true, task, xp: user.xp, level: user.level });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Daily Journal Entry
app.post('/api/journal', authMiddleware, async (req, res) => {
  try {
    const { learned, mistake, focus } = req.body;
    const user = await User.findById(req.userId);
    const today = new Date().toISOString().split('T')[0];

    const idx = user.journal.findIndex(j => j.date === today);
    if (idx >= 0) {
      user.journal[idx] = { date: today, learned, mistake, focus };
    } else {
      user.journal.unshift({ date: today, learned, mistake, focus });
    }
    await user.save();

    res.json({ success: true, journal: user.journal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Boss Battle
app.post('/api/boss-battle/complete', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.xp += 500;
    user.level = calcLevel(user.xp);
    if (user.bossBattles && user.bossBattles.length > 0) {
      user.bossBattles[0].status = 'completed';
    }

    // Unlock Boss Slayer Achievement
    const today = new Date().toISOString().split('T')[0];
    await UserAchievementState.findOneAndUpdate(
      { userId: user._id, achievementId: 'boss_slayer' },
      { unlocked: true, unlockedAt: today },
      { upsert: true }
    );

    await user.save();
    res.json({ success: true, xp: user.xp, level: user.level });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Goals
app.post('/api/settings', authMiddleware, async (req, res) => {
  try {
    const { dailyXpGoal, problemsPerDay, studyHours } = req.body;
    const user = await User.findById(req.userId);
    user.goals = { dailyXpGoal, problemsPerDay, studyHours };
    await user.save();
    res.json({ success: true, goals: user.goals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback route to serve index.html for unknown frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Placement Quest Server running on http://localhost:${PORT}`);
});
