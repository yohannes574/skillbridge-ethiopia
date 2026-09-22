const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // index of correct option
});

const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['module', 'final'], required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', default: null },
  questions: [questionSchema],
  passingScore: { type: Number, default: 70 },
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
