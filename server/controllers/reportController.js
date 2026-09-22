const Report = require('../models/Report');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Module = require('../models/Module');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const REPORT_CATEGORIES = ['harassment', 'spam', 'abuse', 'inappropriate_content', 'cheating', 'fake_information', 'other'];

const buildCategorySummary = async (reportedUserId) => {
  const rows = await Report.aggregate([
    { $match: { reportedUserId } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return rows.map((row) => `${row._id.replaceAll('_', ' ')} (${row.count})`).join(', ');
};

const resolveReportedUser = async ({ courseId, contentId, contentType }) => {
  const course = await Course.findById(courseId).populate('mentorId', 'name email');
  if (!course) return null;

  if (contentType === 'lesson' && contentId) {
    const lesson = await Lesson.findById(contentId).populate('moduleId', 'courseId');
    if (lesson?.moduleId?.courseId?.toString() !== course._id.toString()) {
      return null;
    }
  }

  if (contentType === 'module' && contentId) {
    const mod = await Module.findById(contentId).select('courseId');
    if (mod?.courseId?.toString() !== course._id.toString()) {
      return null;
    }
  }

  return course.mentorId || null;
};

// @desc   Create report
// @route  POST /api/reports
const createReport = async (req, res) => {
  try {
    const { courseId, contentId, contentType, category, message } = req.body;

    if (!courseId || !contentId || !contentType || !message) {
      return res.status(400).json({ success: false, message: 'Course, content, type, and message are required' });
    }

    if (!REPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid report category' });
    }

    const reportedUser = await resolveReportedUser({ courseId, contentId, contentType });
    if (!reportedUser) {
      return res.status(400).json({ success: false, message: 'Unable to resolve reported user for this content' });
    }

    const report = await Report.create({
      studentId: req.user._id,
      reportedUserId: reportedUser._id,
      courseId,
      contentId,
      contentType,
      category,
      message,
    });

    const totalReports = await Report.countDocuments({ reportedUserId: reportedUser._id });
    const categorySummary = await buildCategorySummary(reportedUser._id);

    if (totalReports === 3 && !report.warningIssued) {
      report.warningIssued = true;
      report.adminAction = 'warned';
      await report.save();

      await createNotification({
        userId: reportedUser._id,
        type: 'report_warning',
        title: 'Account warning: 3 reports received',
        message: `Your account has received 3 reports. Categories: ${categorySummary || 'other'}. Please review platform rules immediately.`,
        link: '/student/dashboard',
        metadata: { totalReports, reportedUserId: reportedUser._id, categorySummary },
      });

      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        await createNotification({
          userId: admin._id,
          type: 'report_warning',
          title: `User warning issued: ${reportedUser.name}`,
          message: `${reportedUser.name} has reached 3 reports. Categories: ${categorySummary || 'other'}. Review and monitor the account.`,
          link: '/admin/reports',
          metadata: { totalReports, reportedUserId: reportedUser._id, categorySummary },
        });
      }
    }

    if (totalReports >= 4 && !report.adminAlerted) {
      report.adminAlerted = true;
      await report.save();

      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        await createNotification({
          userId: admin._id,
          type: 'report_review',
          title: `Review required: ${reportedUser.name} has ${totalReports} reports`,
          message: `You have to review this report. Reports received: ${categorySummary || 'other'}. You can warn or restrict the user from the system.`,
          link: '/admin/reports',
          metadata: { totalReports, reportedUserId: reportedUser._id, categorySummary },
        });
      }
    }

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all reports (admin)
// @route  GET /api/reports
const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('studentId', 'name email')
      .populate('reportedUserId', 'name email role isBlocked')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    const reportCounts = await Report.aggregate([
      { $group: { _id: '$reportedUserId', totalReports: { $sum: 1 } } },
    ]);
    const countMap = new Map(reportCounts.map((row) => [String(row._id), row.totalReports]));

    const reportsWithCounts = reports.map((report) => ({
      ...report.toObject(),
      reportedUserReportCount: countMap.get(String(report.reportedUserId?._id || report.reportedUserId)) || 0,
    }));

    res.json({ success: true, count: reports.length, data: reportsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update report status (admin)
// @route  PATCH /api/reports/:id
const updateReport = async (req, res) => {
  try {
    const { status, adminNote, action } = req.body;
    const report = await Report.findById(req.params.id)
      .populate('reportedUserId', 'name email role isBlocked')
      .populate('studentId', 'name email');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (typeof status === 'string') report.status = status;
    if (typeof adminNote === 'string') report.adminNote = adminNote;

    if (action === 'warn' && report.reportedUserId) {
      report.adminAction = 'warned';
      await createNotification({
        userId: report.reportedUserId._id,
        type: 'report_warning',
        title: 'Admin warning issued',
        message: adminNote || 'An admin has issued a warning after reviewing the reports on your account.',
        link: '/student/dashboard',
        metadata: { reportId: report._id },
      });
    }

    if (action === 'block' && report.reportedUserId) {
      report.adminAction = 'restricted';
      const user = await User.findById(report.reportedUserId._id);
      if (user && user.role !== 'admin') {
        user.isBlocked = true;
        await user.save();

        await createNotification({
          userId: user._id,
          type: 'report_restricted',
          title: 'Account restricted by admin',
          message: adminNote || 'Your account has been restricted due to repeated reports.',
          link: '/student/dashboard',
          metadata: { reportId: report._id },
        });
      }
    }

    report.status = 'reviewed';
    await report.save();

    const updated = await Report.findById(report._id)
      .populate('studentId', 'name email')
      .populate('reportedUserId', 'name email role isBlocked')
      .populate('courseId', 'title');

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReport, getReports, updateReport };
