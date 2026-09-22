const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'note', 'pdf', 'link'], required: true },
  contentUrl: { type: String, required: true },
  order: { type: Number, default: 0 },
  duration: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
