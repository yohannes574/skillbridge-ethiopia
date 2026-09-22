const CertificateRequest = require('../models/CertificateRequest');
const Certificate = require('../models/Certificate');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Result = require('../models/Result');
const Test = require('../models/Test');
const Module = require('../models/Module');
const UserBadge = require('../models/UserBadge');
const Badge = require('../models/Badge');
const User = require('../models/User');
const { generateCertificateHTML } = require('../utils/generateCertificate');
const { createNotification } = require('./notificationController');

// ─── helpers ────────────────────────────────────────────────────────────────
const getStudentDetail = async (studentId, courseId) => {
  const progress = await Progress.findOne({ studentId, courseId });
  const course   = await Course.findById(courseId).populate('modules');
  const totalMod = course?.modules?.length || 0;
  const doneMod  = progress?.completedModules?.length || 0;
  const pct      = totalMod > 0 ? Math.round((doneMod / totalMod) * 100) : 0;

  // Gather quiz results
  const tests   = await Test.find({ courseId });
  const results = await Result.find({ studentId, testId: { $in: tests.map(t => t._id) } });
  const latestByTest = {};
  results.forEach((result) => {
    const key = result.testId?.toString();
    if (!key) return;
    if (!latestByTest[key]) {
      latestByTest[key] = result;
      return;
    }
    if (new Date(result.createdAt).getTime() > new Date(latestByTest[key].createdAt).getTime()) {
      latestByTest[key] = result;
    }
  });

  const quizSummary = tests.map(t => {
    const r = latestByTest[t._id.toString()];
    return {
      testTitle: t.title,
      type: t.type,
      passed: r?.passed ?? false,
      score: r?.score ?? null,
    };
  });

  return { progress: pct, modulesCompleted: doneMod, totalModules: totalMod, quizzes: quizSummary };
};

// @desc   Student: Request certificate
// @route  POST /api/certificates/request
const requestCertificate = async (req, res) => {
  try {
    const { courseId, mentorId } = req.body;

    const progress = await Progress.findOne({ studentId: req.user._id, courseId });
    const course   = await Course.findById(courseId).populate('modules');
    if (!progress || progress.completedModules.length < course.modules.length) {
      return res.status(400).json({ success: false, message: 'Complete all modules first' });
    }

    const finalTest = await Test.findOne({ courseId, type: 'final' });
    if (finalTest) {
      const result = await Result.findOne({ studentId: req.user._id, testId: finalTest._id, passed: true });
      if (!result) return res.status(400).json({ success: false, message: 'Pass the final test first (≥70%)' });
    }

    const existing = await CertificateRequest.findOne({ studentId: req.user._id, courseId });
    if (existing && existing.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Certificate request already submitted', data: existing });
    }

    // Allow re-request after rejection — delete old one
    if (existing && existing.status === 'rejected') {
      await CertificateRequest.deleteOne({ _id: existing._id });
    }

    const certRequest = await CertificateRequest.create({
      studentId: req.user._id,
      courseId,
      mentorId,
      status: 'mentor_pending',
    });

    // Notify mentor
    await createNotification({
      userId: mentorId,
      type: 'certificate_request',
      title: `Certificate request from ${req.user.name}`,
      message: `${req.user.name} has completed "${course.title}" and is requesting a certificate. Please review their progress.`,
      link: '/mentor/certificates',
      metadata: { certRequestId: certRequest._id, courseId, studentId: req.user._id },
    });

    res.status(201).json({ success: true, data: certRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mentor: Approve or Reject certificate request
// @route  PATCH /api/certificates/request/:id/mentor
const mentorRespondToCert = async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'approve' | 'reject'
    const certRequest = await CertificateRequest.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .populate('mentorId', 'name');

    if (!certRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (certRequest.mentorId._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your certificate request' });
    if (certRequest.status !== 'mentor_pending')
      return res.status(400).json({ success: false, message: 'Already actioned' });

    certRequest.mentorStatus  = action === 'approve' ? 'approved' : 'rejected';
    certRequest.mentorNote    = note || '';
    certRequest.mentorActionAt = new Date();

    if (action === 'reject') {
      certRequest.status          = 'rejected';
      certRequest.rejectedBy      = 'mentor';
      certRequest.rejectionReason = note || 'No reason provided';
      await certRequest.save();

      // Notify student with reason
      await createNotification({
        userId: certRequest.studentId._id,
        type: 'certificate_approved',
        title: `Certificate request declined`,
        message: `Your certificate request for "${certRequest.courseId.title}" was declined by your mentor. Reason: ${certRequest.rejectionReason}`,
        link: '/student/certificates',
        metadata: { certRequestId: certRequest._id },
      });

      return res.json({ success: true, message: 'Request rejected and student notified', data: certRequest });
    }

    // Approve → forward to admin
    certRequest.status = 'admin_pending';
    await certRequest.save();

    // Find any admin
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      const detail = await getStudentDetail(certRequest.studentId._id, certRequest.courseId._id);
      await createNotification({
        userId: admin._id,
        type: 'certificate_request',
        title: `Certificate approval needed: ${certRequest.studentId.name}`,
        message: `Mentor ${certRequest.mentorId.name} has approved ${certRequest.studentId.name}'s certificate for "${certRequest.courseId.title}" (${detail.progress}% complete). Awaiting your final approval.`,
        link: '/admin/certificates',
        metadata: { certRequestId: certRequest._id },
      });
    }

    // Notify student that mentor approved, waiting for admin
    await createNotification({
      userId: certRequest.studentId._id,
      type: 'certificate_approved',
      title: `Your mentor approved your certificate! ✅`,
      message: `Your certificate request for "${certRequest.courseId.title}" has been approved by your mentor and sent to the admin for final approval.`,
      link: '/student/certificates',
      metadata: { certRequestId: certRequest._id },
    });

    res.json({ success: true, message: 'Mentor approved — forwarded to admin', data: certRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Admin: Approve or Reject certificate request (after mentor approval)
// @route  PATCH /api/certificates/request/:id/admin
const adminRespondToCert = async (req, res) => {
  try {
    const { action, note } = req.body;
    const certRequest = await CertificateRequest.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .populate('mentorId', 'name email');

    if (!certRequest) return res.status(404).json({ success: false, message: 'Request not found' });
    if (certRequest.status !== 'admin_pending')
      return res.status(400).json({ success: false, message: 'Not awaiting admin action' });

    certRequest.adminStatus  = action === 'approve' ? 'approved' : 'rejected';
    certRequest.adminNote    = note || '';
    certRequest.adminActionAt = new Date();

    if (action === 'reject') {
      certRequest.status          = 'rejected';
      certRequest.rejectedBy      = 'admin';
      certRequest.rejectionReason = note || 'No reason provided';
      await certRequest.save();

      // Notify student
      await createNotification({
        userId: certRequest.studentId._id,
        type: 'certificate_approved',
        title: `Certificate request rejected by admin`,
        message: `Your certificate for "${certRequest.courseId.title}" was rejected by the admin. Reason: ${certRequest.rejectionReason}`,
        link: '/student/certificates',
        metadata: { certRequestId: certRequest._id },
      });

      // Notify mentor
      await createNotification({
        userId: certRequest.mentorId._id,
        type: 'certificate_approved',
        title: `Admin rejected a certificate you approved`,
        message: `The admin rejected ${certRequest.studentId.name}'s certificate for "${certRequest.courseId.title}". Reason: ${certRequest.rejectionReason}`,
        link: '/mentor/certificates',
        metadata: { certRequestId: certRequest._id },
      });

      return res.json({ success: true, message: 'Rejected and all parties notified', data: certRequest });
    }

    // Approve → issue certificate
    certRequest.status = 'approved';
    await certRequest.save();

    const cert = await Certificate.create({
      studentId: certRequest.studentId._id,
      courseId: certRequest.courseId._id,
      mentorId: certRequest.mentorId._id,
      issuedAt: new Date(),
    });

    // Auto-assign course completion badge
    const completionBadge = await Badge.findOne({ title: 'Course Completer' });
    if (completionBadge) {
      const existingBadge = await UserBadge.findOne({ userId: certRequest.studentId._id, badgeId: completionBadge._id });
      if (!existingBadge) {
        await UserBadge.create({
          userId: certRequest.studentId._id,
          badgeId: completionBadge._id,
          courseId: certRequest.courseId._id,
        });
      }
    }

    // Notify student — CERTIFICATE ISSUED 🎉
    await createNotification({
      userId: certRequest.studentId._id,
      type: 'certificate_approved',
      title: `🏆 Certificate Issued! Congratulations!`,
      message: `Your certificate for "${certRequest.courseId.title}" has been officially approved and issued by the admin. View it in your certificates page!`,
      link: '/student/certificates',
      metadata: { certId: cert._id, certRequestId: certRequest._id },
    });

    // Notify mentor
    await createNotification({
      userId: certRequest.mentorId._id,
      type: 'certificate_approved',
      title: `Certificate issued to ${certRequest.studentId.name}`,
      message: `The admin has issued a certificate to ${certRequest.studentId.name} for completing "${certRequest.courseId.title}".`,
      link: '/mentor/certificates',
      metadata: { certRequestId: certRequest._id },
    });

    res.json({ success: true, message: 'Certificate approved and issued!', data: cert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get certificate requests (role-filtered, with student detail for mentor/admin)
// @route  GET /api/certificates/requests
const getCertificateRequests = async (req, res) => {
  try {
    const { role } = req.user;
    const filter = {};
    if (role === 'mentor') filter.mentorId = req.user._id;
    if (role === 'student') filter.studentId = req.user._id;
    // admin sees all (no filter)

    const requests = await CertificateRequest.find(filter)
      .populate('studentId', 'name email avatar')
      .populate('courseId', 'title thumbnail')
      .populate('mentorId', 'name email')
      .sort({ createdAt: -1 });

    // Attach student progress/quiz detail for mentor and admin views
    if (role === 'mentor' || role === 'admin') {
      const detailed = await Promise.all(requests.map(async (r) => {
        const obj = r.toObject();
        try {
          obj.studentDetail = await getStudentDetail(r.studentId._id, r.courseId._id);
        } catch { obj.studentDetail = null; }
        return obj;
      }));
      return res.json({ success: true, data: detailed });
    }

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get student's issued certificates
// @route  GET /api/certificates/mine
const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ studentId: req.user._id })
      .populate('courseId', 'title thumbnail')
      .populate('mentorId', 'name email')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   View certificate HTML (printable)
// @route  GET /api/certificates/:id/view
const viewCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('studentId', 'name')
      .populate('courseId', 'title')
      .populate('mentorId', 'name');
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    const html = generateCertificateHTML({
      studentName: cert.studentId.name,
      courseName: cert.courseId.title,
      mentorName: cert.mentorId.name,
      issuedAt: cert.issuedAt,
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all certified students (employer view)
// @route  GET /api/certificates/students
const getCertifiedStudents = async (req, res) => {
  try {
    const certs = await Certificate.find()
      .populate('studentId', 'name email avatar bio skills')
      .populate('courseId', 'title')
      .populate('mentorId', 'name')
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestCertificate,
  mentorRespondToCert,
  adminRespondToCert,
  getCertificateRequests,
  getMyCertificates,
  viewCertificate,
  getCertifiedStudents,
};
