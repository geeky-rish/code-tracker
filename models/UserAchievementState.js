const mongoose = require('mongoose');

const UserAchievementStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievementId: { type: String, required: true },
  unlocked: { type: Boolean, default: false },
  unlockedAt: { type: String }
}, { timestamps: true });

UserAchievementStateSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model('UserAchievementState', UserAchievementStateSchema);
