const mongoose = require('mongoose');
const Message = require('./server/models/Message');
const User = require('./server/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/SkillBridge_DB_Final').then(async () => {
  const employers = await User.find({ role: 'employer' });
  const msgs = await Message.find().populate('senderId receiverId', 'name role');

  console.log('--- ALL MESSAGES ---');
  msgs.forEach(m => {
    console.log(`From: ${m.senderId?.role} (${m.senderId?.name}) -> To: ${m.receiverId?.role} (${m.receiverId?.name}) | Text: ${m.text}`);
  });

  process.exit(0);
});
