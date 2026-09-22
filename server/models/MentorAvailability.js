const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], required: true },
  startTime: { type: String, required: true }, // e.g. "15:00"
  endTime: { type: String, required: true },   // e.g. "19:00"
});

const availabilitySchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  slots: [slotSchema],
  timezone: { type: String, default: 'Africa/Addis_Ababa' },
}, { timestamps: true });

module.exports = mongoose.model('MentorAvailability', availabilitySchema);
