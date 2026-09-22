const Module = require('../models/Module');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { createNotification } = require('./notificationController');
const notifyAdmins = require('../utils/notifyAdmins');

// @desc   Get modules for a course
// @route  GET /api/modules/course/:courseId
const getModules = async (req, res) => {
  try {
    const modules = await Module.find({ courseId: req.params.courseId })
      .populate('lessons')
      .populate('testId')
      .sort({ order: 1 });
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create module (mentor)
// @route  POST /api/modules
const createModule = async (req, res) => {
  try {
    const { courseId, title, order } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (course.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your course' });
    }

    const module = await Module.create({ courseId, title, order });
    course.modules.push(module._id);
    await course.save();

    // ── Notify all enrolled students ──
    try {
      const enrollments = await Enrollment.find({ courseId }).select('studentId');
      await Promise.all(enrollments.map(e =>
        createNotification({
          userId: e.studentId,
          type: 'new_module',
          title: `New module added to "${course.title}"`,
          message: `📚 A new module "${title}" is now available in your course. Start learning!`,
          link: `/student/course/${courseId}`,
          metadata: { courseId, moduleId: module._id },
        })
      ));
    } catch (notifErr) {
      console.error('Module notification failed:', notifErr.message);
    }

    // ── Notify Admins ──
    await notifyAdmins({
      type: 'general',
      title: 'New Module Content Added',
      message: `Mentor ${req.user.name} added a new module "${title}" to the course "${course.title}". Please review it.`,
      link: '/admin/courses'
    });

    res.status(201).json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update module
// @route  PUT /api/modules/:id
const updateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete module (mentor/admin)
// @route  DELETE /api/modules/:id
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndDelete(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });

    // Remove from course
    await Course.findByIdAndUpdate(module.courseId, { $pull: { modules: module._id } });
    res.json({ success: true, message: 'Module deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getModules, createModule, updateModule, deleteModule };
