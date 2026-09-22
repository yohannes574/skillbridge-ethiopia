const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['remote', 'in-person', 'hybrid'],
    default: 'remote',
  },
  salary: { type: String, default: 'Negotiable' },
  experienceLevel: { type: String, default: 'Entry Level' },
  requiredSkills: [{ type: String }],
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open',
  },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
