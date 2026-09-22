const express = require('express');
const router = express.Router();
const { getLessons, createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.get('/module/:moduleId', protect, getLessons);
router.post('/', ...guard, authorizeRoles('mentor'), createLesson);
router.put('/:id', ...guard, authorizeRoles('mentor', 'admin'), updateLesson);
router.delete('/:id', ...guard, authorizeRoles('mentor', 'admin'), deleteLesson);

module.exports = router;
