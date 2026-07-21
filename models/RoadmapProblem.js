const mongoose = require('mongoose');

const RoadmapProblemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  difficulty: { type: String, required: true },
  pattern: { type: String, required: true },
  xp: { type: Number, required: true },
  phase: { type: String, required: true },
  targetDay: { type: Number, required: true },
  isCore: { type: Boolean, default: false },
  url: { type: String },
  keyPattern: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RoadmapProblem', RoadmapProblemSchema);
