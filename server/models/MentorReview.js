const mongoose = require('mongoose');

const mentorReviewSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

mentorReviewSchema.index({ mentorId: 1, studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('MentorReview', mentorReviewSchema);
