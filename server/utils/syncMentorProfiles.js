const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const run = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/skillbridge';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const mentors = await User.find({ role: 'mentor' });
  let updated = 0;

  for (const mentor of mentors) {
    const ps = mentor.profileSubmission;
    if (!ps) {
      console.log(`${mentor.name}: no profileSubmission, skipping`);
      continue;
    }
    let changed = false;

    if (Array.isArray(ps.skills) && ps.skills.length > 0 && mentor.skills.length === 0) {
      mentor.skills = ps.skills;
      changed = true;
    }
    if (ps.yearsOfExperience && !mentor.yearsOfExperience) {
      const parsed = parseInt(String(ps.yearsOfExperience));
      if (!isNaN(parsed)) { mentor.yearsOfExperience = parsed; changed = true; }
    }
    if (ps.professionalBackground && !mentor.bio) {
      mentor.bio = ps.professionalBackground;
      changed = true;
    }

    if (changed) {
      await mentor.save();
      updated++;
      console.log(`✅ Updated: ${mentor.name} | skills: [${mentor.skills.join(', ')}] | yoe: ${mentor.yearsOfExperience}`);
    } else {
      console.log(`ℹ️  Already synced: ${mentor.name} | skills: [${mentor.skills.join(', ')}]`);
    }
  }

  console.log(`\nDone! Updated ${updated} mentor(s).`);
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
