const express = require('express');
const router = express.Router();
const { createReview, getMentorReviews, checkReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('student'), createReview);
router.get('/check', protect, checkReview);
router.get('/mentor/:mentorId', protect, getMentorReviews);

module.exports = router;
