const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['enrollment_approved', 'enrollment_rejected', 'quiz_passed', 'quiz_failed', 'session_scheduled', 'session_reminder', 'certificate_approved', 'certificate_request', 'new_lesson', 'new_module', 'new_job', 'report_warning', 'report_review', 'report_restricted', 'general'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' }, // frontend route to navigate to
  read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
