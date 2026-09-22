const Session = require('../models/Session');
const MentorAvailability = require('../models/MentorAvailability');
const Enrollment = require('../models/Enrollment');
const { createNotification } = require('./notificationController');
const { v4: uuidv4 } = require('crypto').webcrypto ? require('crypto') : { v4: () => Math.random().toString(36).slice(2) };

// Helper to generate a unique Jitsi room name
const generateRoom = (mentorId, studentId) => {
  const hash = `SkillBridge-${mentorId.toString().slice(-6)}-${studentId.toString().slice(-6)}-${Date.now()}`;
  return hash.replace(/[^a-zA-Z0-9-]/g, '');
};

// @desc   Mentor sets / updates their availability
// @route  POST /api/sessions/availability
const setAvailability = async (req, res) => {
  try {
    const { slots, timezone } = req.body;
    const availability = await MentorAvailability.findOneAndUpdate(
      { mentorId: req.user._id },
      { mentorId: req.user._id, slots, timezone },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: availability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get mentor availability
// @route  GET /api/sessions/availability/:mentorId
const getAvailability = async (req, res) => {
  try {
    const avail = await MentorAvailability.findOne({ mentorId: req.params.mentorId });
    res.json({ success: true, data: avail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Student books a session
// @route  POST /api/sessions/book
const bookSession = async (req, res) => {
  try {
    const { mentorId, courseId, scheduledAt, durationMinutes } = req.body;

    const jitsiRoom = generateRoom(mentorId, req.user._id);

    const session = await Session.create({
      mentorId,
      studentId: req.user._id,
      courseId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes || 60,
      jitsiRoom,
    });

    // Notify both parties
    await createNotification({
      userId: mentorId,
      type: 'session_scheduled',
      title: 'New Session Booked',
      message: `A student has booked a session with you on ${new Date(scheduledAt).toLocaleString()}`,
      link: '/mentor/sessions',
      metadata: { sessionId: session._id },
    });
    await createNotification({
      userId: req.user._id,
      type: 'session_scheduled',
      title: 'Session Confirmed',
      message: `Your session is booked for ${new Date(scheduledAt).toLocaleString()}`,
      link: '/student/sessions',
      metadata: { sessionId: session._id },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get my sessions (mentor or student)
// @route  GET /api/sessions
const getMySessions = async (req, res) => {
  try {
    const filter = req.user.role === 'mentor'
      ? { mentorId: req.user._id }
      : { studentId: req.user._id };

    const sessions = await Session.find(filter)
      .populate('mentorId', 'name avatar')
      .populate('studentId', 'name avatar')
      .populate('courseId', 'title')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update session status
// @route  PATCH /api/sessions/:id
const updateSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Directly schedule a session via Chat (Mentor or Student)
// @route  POST /api/sessions/direct
const directSchedule = async (req, res) => {
  try {
    const { targetUserId, scheduledAt, durationMinutes } = req.body;

    let mentorId, studentId;
    if (req.user.role === 'mentor') {
       mentorId = req.user._id;
       studentId = targetUserId;
    } else {
       mentorId = targetUserId;
       studentId = req.user._id;
    }

    const enrollment = await Enrollment.findOne({ mentorId, studentId });
    if (!enrollment) {
      return res.status(400).json({ success: false, message: 'You must be enrolled to schedule a session.' });
    }

    const jitsiRoom = generateRoom(mentorId, studentId);

    const session = await Session.create({
      mentorId,
      studentId,
      courseId: enrollment.courseId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes: durationMinutes || 60,
      jitsiRoom,
    });

    const otherUserId = req.user.role === 'mentor' ? studentId : mentorId;
    const notificationMessage = req.user.role === 'mentor' 
      ? `Your mentor scheduled a video call for ${new Date(scheduledAt).toLocaleString()}`
      : `Your student requested a video call for ${new Date(scheduledAt).toLocaleString()}`;

    await createNotification({
      userId: otherUserId,
      type: 'session_scheduled',
      title: 'New Video Call',
      message: notificationMessage,
      link: req.user.role === 'mentor' ? '/student/chat' : '/mentor/chat',
      metadata: { sessionId: session._id },
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { setAvailability, getAvailability, bookSession, getMySessions, updateSession, directSchedule };
