const express = require('express');
const router = express.Router();
const { createReport, getReports, updateReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.post('/', ...guard, authorizeRoles('student'), createReport);
router.get('/', ...guard, authorizeRoles('admin'), getReports);
router.patch('/:id', ...guard, authorizeRoles('admin'), updateReport);

module.exports = router;
