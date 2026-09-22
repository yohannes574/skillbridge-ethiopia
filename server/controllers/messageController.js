const Message = require('../models/Message');
const Enrollment = require('../models/Enrollment');
const JobApplication = require('../models/JobApplication');

// @desc   Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    const message = await Message.create({ senderId: req.user._id, receiverId, text });
    await message.populate('senderId', 'name avatar');
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get conversation between two users
// @route  GET /api/messages/:userId
const getConversation = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id },
      ],
    })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get chat contacts (users who messaged you or you messaged)
// @route  GET /api/messages/contacts
const getContacts = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    })
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .sort({ createdAt: -1 });

    const contactMap = new Map();
    messages.forEach((m) => {
      const other = m.senderId._id.toString() === req.user._id.toString() ? m.receiverId : m.senderId;
      if (!contactMap.has(other._id.toString())) {
        contactMap.set(other._id.toString(), { user: other, lastMessage: m });
      }
    });

    // Also bring in enrolled users even if they haven't messaged yet
    const enrollments = await Enrollment.find(
      req.user.role === 'student' ? { studentId: req.user._id } :
      req.user.role === 'mentor' ? { mentorId: req.user._id } : {}
    ).populate('studentId mentorId', 'name avatar role');

    enrollments.forEach(e => {
      const other = req.user.role === 'student' ? e.mentorId : e.studentId;
      if (other && !contactMap.has(other._id.toString())) {
        contactMap.set(other._id.toString(), { user: other, lastMessage: null });
      }
    });

    // Bring in scheduled ATS pairs
    const eligibleApplicationStatuses = ['interview_scheduled', 'interview_completed', 'offer_sent', 'offer_accepted', 'hired'];
    const jobApplications = await JobApplication.find(
      req.user.role === 'student' ? { studentId: req.user._id, status: { $in: eligibleApplicationStatuses } } :
      req.user.role === 'employer' ? { employerId: req.user._id, status: { $in: eligibleApplicationStatuses } } : {}
    ).populate('studentId employerId', 'name avatar role');

    jobApplications.forEach(app => {
      const other = req.user.role === 'student' ? app.employerId : app.studentId;
      if (other && !contactMap.has(other._id.toString())) {
        contactMap.set(other._id.toString(), { user: other, lastMessage: null });
      }
    });

    res.json({ success: true, data: Array.from(contactMap.values()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get unread count
// @route  GET /api/messages/unread
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getConversation, getContacts, getUnreadCount };
