const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { createNotification } = require('./notificationController');
const notifyAdmins = require('../utils/notifyAdmins');

// @desc   Get lessons for a module
// @route  GET /api/lessons/module/:moduleId
const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ moduleId: req.params.moduleId }).sort({ order: 1 });
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create lesson
// @route  POST /api/lessons
const createLesson = async (req, res) => {
  try {
    const { moduleId, title, type, contentUrl, order, duration } = req.body;
    const module = await Module.findById(moduleId);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });

    const lesson = await Lesson.create({ moduleId, title, type, contentUrl, order, duration });
    module.lessons.push(lesson._id);
    await module.save();

    // ── Notify all enrolled students ──
    try {
      const course = await Course.findById(module.courseId).select('title');
      if (course) {
        const enrollments = await Enrollment.find({ courseId: module.courseId }).select('studentId');
        const typeLabel = type === 'video' ? '🎬 Video' : type === 'pdf' ? '📄 PDF' : type === 'link' ? '🔗 Link' : '📝 Note';
        await Promise.all(enrollments.map(e =>
          createNotification({
            userId: e.studentId,
            type: 'new_lesson',
            title: `New lesson added to "${course.title}"`,
            message: `${typeLabel}: "${title}" has been added to the module "${module.title}". Continue learning!`,
            link: `/student/course/${module.courseId}`,
            metadata: { courseId: module.courseId, moduleId, lessonId: lesson._id },
          })
        ));
      }
    } catch (notifErr) {
      console.error('Lesson notification failed:', notifErr.message);
    }

    // ── Notify Admins ──
    const course = await Course.findById(module.courseId).select('title');
    await notifyAdmins({
      type: 'general',
      title: 'New Lesson Content Added',
      message: `Mentor ${req.user.name} added a new lesson "${title}" to the module "${module.title}" in course "${course?.title || 'Unknown Course'}". Please review it.`,
      link: '/admin/courses'
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update lesson
// @route  PUT /api/lessons/:id
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete lesson
// @route  DELETE /api/lessons/:id
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    await Module.findByIdAndUpdate(lesson.moduleId, { $pull: { lessons: lesson._id } });
    res.json({ success: true, message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLessons, createLesson, updateLesson, deleteLesson };
