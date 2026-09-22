const express = require('express');
const router = express.Router();
const { createTest, getTestsByCourse, getTestById, submitTest, getResults, updateTest } = require('../controllers/testController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.post('/', ...guard, authorizeRoles('mentor'), createTest);
router.get('/course/:courseId', ...guard, getTestsByCourse);
router.get('/results/:courseId', ...guard, authorizeRoles('student'), getResults);
router.get('/:id', ...guard, getTestById);
router.put('/:id', ...guard, authorizeRoles('mentor'), updateTest);
router.post('/:id/submit', ...guard, authorizeRoles('student'), submitTest);

module.exports = router;
