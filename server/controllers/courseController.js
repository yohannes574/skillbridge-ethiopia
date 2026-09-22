const Course = require('../models/Course');
const Module = require('../models/Module');
const Enrollment = require('../models/Enrollment');
const notifyAdmins = require('../utils/notifyAdmins');

// @desc   Get all approved courses (public / student browse)
// @route  GET /api/courses
const getCourses = async (req, res) => {
  try {
    const { mentorId } = req.query;
    const filter = {};

    // Admin/mentor can see unapproved; others only approved
    if (req.user && req.user.role === 'admin') {
      if (mentorId) filter.mentorId = mentorId;
    } else if (req.user && req.user.role === 'mentor') {
      filter.mentorId = req.user._id;
    } else {
      filter.isApproved = true;
    }

    const courses = await Course.find(filter)
      .populate('mentorId', 'name email avatar bio')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single course
// @route  GET /api/courses/:id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('mentorId', 'name email avatar bio')
      .populate({
        path: 'modules',
        populate: { path: 'lessons' },
      });

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Students can only see approved courses unless enrolled mentor shows them
    if (req.user && req.user.role === 'student' && !course.isApproved) {
      return res.status(403).json({ success: false, message: 'Course not available' });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create course (mentor)
// @route  POST /api/courses
const createCourse = async (req, res) => {
  try {
    if (!req.user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your account must be approved before creating courses.' });
    }
    const { title, description, category, level, thumbnail } = req.body;
    const course = await Course.create({
      title, description, category, level, thumbnail,
      mentorId: req.user._id,
      isApproved: false,
    });

    await notifyAdmins({
      type: 'general',
      title: 'New Course Submission',
      message: `A new course "${title}" has been submitted for approval by ${req.user.name}.`,
      link: '/admin/courses'
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update course (mentor/admin)
// @route  PUT /api/courses/:id
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (req.user.role === 'mentor' && course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your course' });
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete course (admin / mentor)
// @route  DELETE /api/courses/:id
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (req.user.role === 'mentor' && course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await course.deleteOne();
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Approve course (admin)
// @route  PATCH /api/courses/:id/approve
const approveCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course approved', data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Reject course (admin)
// @route  PATCH /api/courses/:id/reject
const rejectCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course rejected', data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get enrolled courses for student
// @route  GET /api/courses/enrolled
const getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate({
        path: 'courseId',
        populate: [
          { path: 'mentorId', select: 'name email avatar skills yearsOfExperience rating reviewCount' },
          { path: 'modules', select: '_id' },
        ],
      })
      .sort({ createdAt: -1 });

    const validEnrollments = enrollments.filter((enrollment) => enrollment.courseId);

    res.json({ success: true, data: validEnrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, approveCourse, rejectCourse, getEnrolledCourses };
