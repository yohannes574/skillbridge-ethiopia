const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  answers: [{ type: Number }], // student's answer indices
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
