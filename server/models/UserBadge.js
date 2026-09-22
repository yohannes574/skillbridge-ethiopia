const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  earnedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('UserBadge', userBadgeSchema);
