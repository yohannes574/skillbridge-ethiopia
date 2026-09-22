const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contentType: { type: String, enum: ['lesson', 'module', 'course'], default: 'lesson' },
  category: {
    type: String,
    enum: ['harassment', 'spam', 'abuse', 'inappropriate_content', 'cheating', 'fake_information', 'other'],
    default: 'other',
  },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  adminNote: { type: String, default: '' },
  warningIssued: { type: Boolean, default: false },
  adminAlerted: { type: Boolean, default: false },
  adminAction: { type: String, enum: ['none', 'warned', 'restricted', 'reviewed'], default: 'none' },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
