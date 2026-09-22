const express = require('express');
const router = express.Router();
const { getBadges, createBadge, updateBadge, deleteBadge, getMyBadges, assignBadge } = require('../controllers/badgeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.get('/', protect, getBadges);
router.get('/mine', ...guard, getMyBadges);
router.post('/', ...guard, authorizeRoles('admin'), createBadge);
router.post('/assign', ...guard, authorizeRoles('admin'), assignBadge);
router.put('/:id', ...guard, authorizeRoles('admin'), updateBadge);
router.delete('/:id', ...guard, authorizeRoles('admin'), deleteBadge);

module.exports = router;
