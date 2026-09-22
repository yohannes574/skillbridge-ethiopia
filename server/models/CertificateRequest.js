const mongoose = require('mongoose');

const certificateRequestSchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  mentorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Two-stage status workflow: mentor_pending → admin_pending → approved/rejected
  status: {
    type: String,
    enum: ['mentor_pending', 'admin_pending', 'approved', 'rejected'],
    default: 'mentor_pending',
  },

  // Who actioned last and when
  mentorStatus:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  mentorNote:     { type: String, default: '' },
  mentorActionAt: { type: Date },

  adminStatus:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:      { type: String, default: '' },
  adminActionAt:  { type: Date },

  // Rejection reason visible to student (and mentor for admin rejection)
  rejectionReason: { type: String, default: '' },
  rejectedBy:      { type: String, enum: ['mentor', 'admin', ''], default: '' },

}, { timestamps: true });

certificateRequestSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('CertificateRequest', certificateRequestSchema);
