const EnrollmentRequest = require('../models/EnrollmentRequest');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const { createNotification } = require('./notificationController');

// @desc   Student requests to join a course with a mentor
// @route  POST /api/enrollments/request
const requestEnrollment = async (req, res) => {
  try {
    const { mentorId, courseId, message } = req.body;

    const existing = await EnrollmentRequest.findOne({ studentId: req.user._id, courseId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a request for this course' });
    }

    const request = await EnrollmentRequest.create({
      studentId: req.user._id,
      mentorId,
      courseId,
      message,
    });

    // Notify the mentor
    const course = await Course.findById(courseId);
    await createNotification({
      userId: mentorId,
      type: 'general',
      title: 'New Enrollment Request',
      message: `${req.user.name} wants to enroll in "${course?.title || 'a course'}"`,
      link: '/mentor/students',
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get enrollment requests (mentor sees theirs, student sees theirs)
// @route  GET /api/enrollments/requests
const getEnrollmentRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'mentor') filter.mentorId = req.user._id;
    if (req.user.role === 'student') filter.studentId = req.user._id;

    const requests = await EnrollmentRequest.find(filter)
      .populate('studentId', 'name email avatar')
      .populate('mentorId', 'name email avatar skills rating yearsOfExperience reviewCount')
      .populate('courseId', 'title thumbnail category level durationWeeks')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mentor accepts or rejects request
// @route  PATCH /api/enrollments/requests/:id
const respondToRequest = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body; // 'accepted' or 'rejected'
    const request = await EnrollmentRequest.findById(req.params.id)
      .populate('courseId', 'title');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    request.status = status;
    if (status === 'rejected' && rejectionReason) {
      request.rejectionReason = rejectionReason;
    }
    await request.save();

    if (status === 'accepted') {
      const existingEnrollment = await Enrollment.findOne({
        studentId: request.studentId,
        courseId: request.courseId._id || request.courseId,
      });

      if (!existingEnrollment) {
        await Enrollment.create({
          studentId: request.studentId,
          mentorId: request.mentorId,
          courseId: request.courseId._id || request.courseId,
        });

        await Progress.create({
          studentId: request.studentId,
          courseId: request.courseId._id || request.courseId,
          completedLessons: [],
          completedModules: [],
          testScores: [],
        });
      }

      // Notify student of approval
      await createNotification({
        userId: request.studentId,
        type: 'enrollment_approved',
        title: 'Enrollment Approved! 🎉',
        message: `Your mentor approved your request for "${request.courseId?.title || 'the course'}". You now have full access!`,
        link: `/student/course/${request.courseId._id || request.courseId}`,
      });
    } else {
      // Notify student of rejection with reason
      const reasonText = rejectionReason ? ` Reason: "${rejectionReason}"` : '';
      await createNotification({
        userId: request.studentId,
        type: 'enrollment_rejected',
        title: 'Enrollment Request Declined',
        message: `Your enrollment request for "${request.courseId?.title || 'the course'}" was not approved.${reasonText} You can try requesting a different mentor.`,
        link: '/student/browse',
      });
    }

    res.json({ success: true, message: `Request ${status}`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get enrolled students for a mentor
// @route  GET /api/enrollments/students
const getMentorStudents = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ mentorId: req.user._id })
      .populate('studentId', 'name email avatar bio skills')
      .populate('courseId', 'title');

    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Check if student is enrolled in a course
// @route  GET /api/enrollments/check/:courseId
const checkEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId: req.params.courseId,
    });
    res.json({ success: true, enrolled: !!enrollment, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { requestEnrollment, getEnrollmentRequests, respondToRequest, getMentorStudents, checkEnrollment };
