const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🏅' },
  color: { type: String, default: '#f59e0b' },
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema);
