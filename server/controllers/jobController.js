const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Certificate = require('../models/Certificate');
const UserBadge = require('../models/UserBadge');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc   Create a new job posting
// @route  POST /api/jobs
// @access Private (Employer)
const createJob = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employers can post jobs' });
    }

    const { title, type, salary, experienceLevel, requiredSkills, description } = req.body;

    const job = await Job.create({
      employerId: req.user._id,
      title,
      type,
      salary,
      experienceLevel,
      requiredSkills,
      description,
      status: 'open',
    });

    const students = await User.find({ role: 'student', isApproved: true }).select('_id');
    const notifications = students.map(student => ({
      userId: student._id,
      type: 'new_job',
      title: 'New Job Posted!',
      message: `A new ${type} position for ${title} has been posted. Apply now!`,
      link: '/student/jobs',
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications).catch(err => console.error('Bulk notification failed:', err));
    }

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all jobs posted by the logged-in employer
// @route  GET /api/jobs/employer
// @access Private (Employer)
const getEmployerJobs = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const jobs = await Job.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    
    // For each job, count pending applications (if needed)
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const appCount = await JobApplication.countDocuments({ jobId: job._id, status: 'pending' });
      return { ...job.toObject(), pendingApplicationsCount: appCount };
    }));

    res.json({ success: true, count: jobsWithCounts.length, data: jobsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all open jobs (for students)
// @route  GET /api/jobs
// @access Private
const getAllOpenJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'open' })
      .populate('employerId', 'name email avatar')
      .sort({ createdAt: -1 });
    
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const appCount = await JobApplication.countDocuments({ jobId: job._id });
      return { ...job.toObject(), applicantCount: appCount };
    }));

    res.json({ success: true, count: jobsWithCounts.length, data: jobsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Apply for a job
// @route  POST /api/jobs/:id/apply
// @access Private (Student)
const applyForJob = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can apply for jobs' });
    }

    const { coverLetter, resumeUrl, githubUrl, portfolioUrl } = req.body;
    const jobId = req.params.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
    }

    // Check if already applied
    const existing = await JobApplication.findOne({ jobId, studentId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    const application = await JobApplication.create({
      jobId,
      studentId: req.user._id,
      employerId: job.employerId,
      coverLetter: coverLetter || '',
      resumeUrl: resumeUrl || '',
      githubUrl: githubUrl || '',
      portfolioUrl: portfolioUrl || '',
      status: 'pending',
      stageTracking: {}
    });

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all job applications for an employer's jobs
// @route  GET /api/jobs/applications
// @access Private (Employer)
const getJobApplications = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employers can view applications' });
    }

    const rawApplications = await JobApplication.find({ employerId: req.user._id })
      .populate('jobId', 'title type status')
      .populate('studentId', 'name email avatar skills bio')
      .sort({ createdAt: -1 })
      .lean();

    const applications = await Promise.all(rawApplications.map(async (app) => {
      if (!app.studentId) return app;
      const certs = await Certificate.find({ studentId: app.studentId._id }).populate('courseId', 'title').lean();
      const userBadges = await UserBadge.find({ userId: app.studentId._id }).populate('badgeId', 'title icon color').lean();
      
      return {
        ...app,
        completedCourses: certs.map(c => c.courseId?.title).filter(Boolean),
        badges: userBadges.map(ub => ub.badgeId).filter(Boolean)
      };
    }));

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update a job application status
// @route  PATCH /api/jobs/applications/:id
// @access Private (Employer)
const updateApplicationStatus = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user._id },
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    res.json({ success: true, message: 'Status updated', data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all accepted applications for the logged in student
// @route  GET /api/jobs/my-applications
// @access Private (Student)
const getStudentApplications = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can view their applications' });
    }

    const applications = await JobApplication.find({ studentId: req.user._id })
      .populate('jobId')
      .populate('employerId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Send a formal job offer to a student
// @route  PATCH /api/jobs/applications/:id/offer
// @access Private (Employer)
const sendJobOffer = async (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Not authorized' });

    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user._id },
      { 
        status: 'offer_sent',
        offerDetails: req.body 
      },
      { new: true }
    );

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, message: 'Job offer sent successfully', data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Student responds to a job offer or submits test
// @route  PATCH /api/jobs/applications/:id/student-response
// @access Private (Student)
const respondToOffer = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ success: false, message: 'Not authorized' });

    const { status, testSubmission } = req.body; 

    let updateQuery = {};
    if (status) {
      if (!['offer_accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid response status' });
      }
      updateQuery.status = status;
    }

    const application = await JobApplication.findOne({ _id: req.params.id, studentId: req.user._id });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    if (testSubmission) {
      updateQuery['stageTracking.assignmentStudentSubmissionUrl'] = testSubmission.assignmentUrl || application.stageTracking?.assignmentStudentSubmissionUrl;
      updateQuery['stageTracking.quizScoreSubmitted'] = testSubmission.score !== undefined ? testSubmission.score : application.stageTracking?.quizScoreSubmitted;
    }

    const updatedApp = await JobApplication.findByIdAndUpdate(application._id, { $set: updateQuery }, { new: true });

    res.json({ success: true, message: `Application updated successfully`, data: updatedApp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Employer finalizes the hire and closes the job
// @route  PATCH /api/jobs/applications/:id/hire
// @access Private (Employer)
const finalizeHire = async (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Not authorized' });

    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, employerId: req.user._id, status: 'offer_accepted' },
      { status: 'hired' },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or not in offer_accepted state' });
    }

    // Automatically close the Job
    await Job.findByIdAndUpdate(application.jobId, { status: 'closed' });

    res.json({ success: true, message: 'Candidate successfully hired and job closed', data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Universal Stage Advancer for full ATS pipeline
// @route  PATCH /api/jobs/applications/:id/advance
// @access Private (Employer)
const advanceApplicationStage = async (req, res) => {
  try {
    if (req.user.role !== 'employer') return res.status(403).json({ success: false, message: 'Not authorized' });

    const { status, trackingPayload } = req.body;
    // ensure valid generic progression request
    const validStatuses = ['under_review', 'test_assigned', 'interview_scheduled', 'interview_completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ATS stage progression' });
    }

    const existingApplication = await JobApplication.findOne({ _id: req.params.id, employerId: req.user._id });
    if (!existingApplication) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    let updateQuery = { status };
    if (trackingPayload) {
      // Keep previously stored stage data (quiz, submissions, room info) when advancing stages.
      updateQuery.stageTracking = {
        ...(existingApplication.stageTracking?.toObject ? existingApplication.stageTracking.toObject() : existingApplication.stageTracking || {}),
        ...trackingPayload,
      };
    }

    const application = await JobApplication.findByIdAndUpdate(existingApplication._id, updateQuery, { new: true });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    if (status === 'interview_scheduled' && application.stageTracking?.interviewDate && application.stageTracking?.interviewTime) {
      const interviewDateLabel = new Date(application.stageTracking.interviewDate).toLocaleDateString();
      const interviewTimeLabel = application.stageTracking.interviewTime;

      await Notification.create({
        userId: application.studentId,
        type: 'session_scheduled',
        title: 'Interview Scheduled',
        message: `Your interview is scheduled for ${interviewDateLabel} at ${interviewTimeLabel}.`,
        link: '/student/jobs',
      }).catch(() => {});

      await Notification.create({
        userId: application.employerId,
        type: 'session_scheduled',
        title: 'Interview Scheduled',
        message: `Interview with candidate is scheduled for ${interviewDateLabel} at ${interviewTimeLabel}.`,
        link: '/employer/requests',
      }).catch(() => {});
    }

    res.json({ success: true, message: `Application advanced to ${status.replace('_', ' ')}`, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark interview join timestamp for current user (student/employer)
// @route  PATCH /api/jobs/applications/:id/interview-join
// @access Private (Student, Employer)
const markInterviewJoined = async (req, res) => {
  try {
    if (!['student', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const filter = { _id: req.params.id };
    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } else {
      filter.employerId = req.user._id;
    }

    const application = await JobApplication.findOne(filter);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    const joinField = req.user.role === 'student'
      ? 'stageTracking.studentJoinedAt'
      : 'stageTracking.employerJoinedAt';

    const existingJoinTime = req.user.role === 'student'
      ? application.stageTracking?.studentJoinedAt
      : application.stageTracking?.employerJoinedAt;

    if (existingJoinTime) {
      return res.json({ success: true, data: application, message: 'Interview join already recorded' });
    }

    const updated = await JobApplication.findByIdAndUpdate(
      application._id,
      { $set: { [joinField]: new Date() } },
      { new: true }
    );

    res.json({ success: true, data: updated, message: 'Interview join recorded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get basic hiring pipeline stats
// @route  GET /api/jobs/pipeline-stats
// @access Private (Employer)
const getPipelineStats = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ success: false, message: 'Only employers can view pipeline stats' });
    }

    const applications = await JobApplication.find({ employerId: req.user._id });
    
    let applied = 0;
    let shortlisted = 0;
    let hired = 0;

    applications.forEach(app => {
      if (['pending', 'under_review'].includes(app.status)) applied++;
      else if (['test_assigned', 'interview_scheduled', 'interview_completed'].includes(app.status)) shortlisted++;
      else if (['offer_sent', 'offer_accepted', 'hired'].includes(app.status)) hired++;
    });

    res.json({ success: true, data: { applied, shortlisted, hired } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createJob,
  getEmployerJobs,
  getAllOpenJobs,
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  getStudentApplications,
  sendJobOffer,
  respondToOffer,
  finalizeHire,
  advanceApplicationStage,
  getPipelineStats,
  markInterviewJoined
};
