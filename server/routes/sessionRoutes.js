const express = require('express');
const router = express.Router();
const { setAvailability, getAvailability, bookSession, getMySessions, updateSession, directSchedule } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/availability', protect, authorizeRoles('mentor'), setAvailability);
router.get('/availability/:mentorId', protect, getAvailability);
router.post('/book', protect, authorizeRoles('student'), bookSession);
router.post('/direct', protect, directSchedule); // Both roles can use this
router.get('/', protect, getMySessions);
router.patch('/:id', protect, updateSession);

module.exports = router;
