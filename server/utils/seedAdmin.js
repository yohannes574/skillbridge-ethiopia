require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

const seedAdmin = async () => {
  await connectDB();

  const adminEmail = 'admin@gmail.com'; // change this anytime
  const adminPassword = '12121212'; // change this anytime

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const result = await mongoose.connection.collection('users').updateOne(
    { email: adminEmail }, // search by email
    {
      $set: {
        name: 'Platform Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
        isBlocked: false,
        avatar: '',
        bio: 'Skill Bridge Ethiopia Platform Administrator',
        skills: [],
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      }
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log('✅ Admin created successfully!');
  } else {
    console.log('🔄 Admin updated successfully!');
  }

  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);

  process.exit();
};

seedAdmin();