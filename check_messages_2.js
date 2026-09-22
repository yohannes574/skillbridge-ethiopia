const mongoose = require('mongoose');

// Define simplified schemas
const UserSchema = new mongoose.Schema({
  name: String,
  role: String
});
const MessageSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  receiverId: mongoose.Schema.Types.ObjectId,
  text: String
});
const JobApplicationSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  employerId: mongoose.Schema.Types.ObjectId,
  status: String
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);
const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/SkillBridge_DB_Final');
  
  const msgs = await Message.find();
  const users = await User.find();
  const apps = await JobApplication.find();
  
  const userMap = {};
  users.forEach(u => userMap[u._id.toString()] = `${u.name} [${u.role}]`);
  
  console.log('--- ALL MESSAGES ---');
  msgs.forEach(m => {
    console.log(`From: ${userMap[m.senderId]} -> To: ${userMap[m.receiverId]} | Text: ${m.text}`);
  });
  
  console.log('--- ATS Applications ---');
  apps.forEach(a => {
      console.log(`Student: ${userMap[a.studentId]} | Employer: ${userMap[a.employerId]} | Status: ${a.status}`);
  });

  process.exit(0);
}

run().catch(console.error);
