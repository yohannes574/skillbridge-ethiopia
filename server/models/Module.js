const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);
