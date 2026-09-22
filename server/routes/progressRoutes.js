const express = require('express');
const router = express.Router();
const { getProgress, markLessonComplete, markModuleComplete, getMentorStudentsProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.get('/mentor/students', ...guard, authorizeRoles('mentor'), getMentorStudentsProgress);
router.get('/:courseId', ...guard, getProgress);
router.post('/:courseId/lesson/:lessonId', ...guard, authorizeRoles('student'), markLessonComplete);
router.post('/:courseId/module/:moduleId', ...guard, authorizeRoles('student'), markModuleComplete);

module.exports = router;
