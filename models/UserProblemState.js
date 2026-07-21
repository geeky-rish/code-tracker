const mongoose = require('mongoose');

const UserProblemStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: Number, required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  notes: { type: String, default: '' },
  solvedAt: { type: Date }
}, { timestamps: true });

UserProblemStateSchema.index({ userId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model('UserProblemState', UserProblemStateSchema);
