const Progress = require('../models/Progress');
const Module = require('../models/Module');
const Course = require('../models/Course');

// @desc   Get progress for a student in a course
// @route  GET /api/progress/:courseId
const getProgress = async (req, res) => {
  try {
    const studentId = req.user.role === 'mentor' ? req.query.studentId : req.user._id;
    const progress = await Progress.findOne({ studentId, courseId: req.params.courseId });
    if (!progress) return res.json({ success: true, data: null });
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark a lesson as completed
// @route  POST /api/progress/:courseId/lesson/:lessonId
const markLessonComplete = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    let progress = await Progress.findOne({ studentId: req.user._id, courseId });

    if (!progress) {
      progress = await Progress.create({ studentId: req.user._id, courseId });
    }

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      await progress.save();
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark a module as completed
// @route  POST /api/progress/:courseId/module/:moduleId
const markModuleComplete = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    let progress = await Progress.findOne({ studentId: req.user._id, courseId });

    if (!progress) {
      progress = await Progress.create({ studentId: req.user._id, courseId });
    }

    if (!progress.completedModules.includes(moduleId)) {
      progress.completedModules.push(moduleId);
      await progress.save();
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all progress for a mentor's students
// @route  GET /api/progress/mentor/students
const getMentorStudentsProgress = async (req, res) => {
  try {
    const { studentId, courseId } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (courseId) filter.courseId = courseId;

    const progressList = await Progress.find(filter)
      .populate('studentId', 'name email avatar')
      .populate('courseId', 'title');

    res.json({ success: true, data: progressList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProgress, markLessonComplete, markModuleComplete, getMentorStudentsProgress };
