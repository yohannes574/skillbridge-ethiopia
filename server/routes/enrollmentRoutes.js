const express = require('express');
const router = express.Router();
const { requestEnrollment, getEnrollmentRequests, respondToRequest, getMentorStudents, checkEnrollment } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.post('/request', ...guard, authorizeRoles('student'), requestEnrollment);
router.get('/requests', ...guard, authorizeRoles('student', 'mentor'), getEnrollmentRequests);
router.patch('/requests/:id', ...guard, authorizeRoles('mentor'), respondToRequest);
router.get('/students', ...guard, authorizeRoles('mentor'), getMentorStudents);
router.get('/check/:courseId', ...guard, authorizeRoles('student'), checkEnrollment);

module.exports = router;
