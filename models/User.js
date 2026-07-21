const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  problemId: { type: Number },
  title: { type: String, required: true },
  xp: { type: Number, required: true },
  completed: { type: Boolean, default: false }
});

const BossBattleSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  xpReward: { type: Number, default: 500 },
  status: { type: String, default: 'upcoming' }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 1 },
  longestStreak: { type: Number, default: 1 },
  lastActiveDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  startDate: { type: String, default: '2026-07-22' },
  targetDate: { type: String, default: '2026-08-10' },
  goals: {
    dailyXpGoal: { type: Number, default: 150 },
    problemsPerDay: { type: Number, default: 3 },
    studyHours: { type: Number, default: 3 }
  },
  todayMission: {
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    tasks: [TaskSchema]
  },
  heatmap: { type: Map, of: new mongoose.Schema({ count: Number, xp: Number, hours: Number }, { _id: false }), default: {} },
  journal: [{
    date: { type: String, required: true },
    learned: String,
    mistake: String,
    focus: String
  }],
  bossBattles: [BossBattleSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
