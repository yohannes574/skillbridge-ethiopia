const express = require('express');
const router = express.Router();
const { getModules, createModule, updateModule, deleteModule } = require('../controllers/moduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.get('/course/:courseId', protect, getModules);
router.post('/', ...guard, authorizeRoles('mentor'), createModule);
router.put('/:id', ...guard, authorizeRoles('mentor', 'admin'), updateModule);
router.delete('/:id', ...guard, authorizeRoles('mentor', 'admin'), deleteModule);

module.exports = router;
