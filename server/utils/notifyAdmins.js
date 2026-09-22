const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');

const notifyAdmins = async ({ type, title, message, link = '', metadata = {} }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type,
          title,
          message,
          link,
          metadata,
        })
      )
    );
  } catch (error) {
    console.error('Failed to notify admins:', error.message);
  }
};

module.exports = notifyAdmins;
