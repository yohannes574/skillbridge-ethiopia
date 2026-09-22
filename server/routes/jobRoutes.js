const express = require('express');
const router = express.Router();
const { createJob, getEmployerJobs, getAllOpenJobs, applyForJob, getJobApplications, updateApplicationStatus, getStudentApplications, sendJobOffer, respondToOffer, finalizeHire, advanceApplicationStage, getPipelineStats, markInterviewJoined } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Mount routes
router.post('/', protect, authorizeRoles('employer'), createJob);
router.get('/employer', protect, authorizeRoles('employer'), getEmployerJobs);
router.get('/applications', protect, authorizeRoles('employer'), getJobApplications);
router.patch('/applications/:id', protect, authorizeRoles('employer'), updateApplicationStatus);
router.patch('/applications/:id/advance', protect, authorizeRoles('employer'), advanceApplicationStage);
router.patch('/applications/:id/offer', protect, authorizeRoles('employer'), sendJobOffer);
router.patch('/applications/:id/hire', protect, authorizeRoles('employer'), finalizeHire);
router.patch('/applications/:id/interview-join', protect, authorizeRoles('student', 'employer'), markInterviewJoined);
router.get('/pipeline-stats', protect, authorizeRoles('employer'), getPipelineStats);

router.get('/', protect, getAllOpenJobs);
router.post('/:id/apply', protect, authorizeRoles('student'), applyForJob);
router.get('/my-applications', protect, authorizeRoles('student'), getStudentApplications);
router.patch('/applications/:id/student-response', protect, authorizeRoles('student'), respondToOffer);

module.exports = router;
