const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isApproved: { type: Boolean, default: false },
  thumbnail: { type: String, default: '' },
  category: { type: String, default: 'General' },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  durationWeeks: { type: Number, default: 4 },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
