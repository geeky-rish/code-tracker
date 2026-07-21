const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  icon: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  condition: { type: String, required: true }
});

module.exports = mongoose.model('Achievement', AchievementSchema);
