const mongoose = require('mongoose');

const enrollmentRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

enrollmentRequestSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('EnrollmentRequest', enrollmentRequestSchema);
