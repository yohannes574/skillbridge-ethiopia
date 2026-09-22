const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, approveCourse, rejectCourse, getEnrolledCourses } = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.get('/', protect, getCourses);
router.get('/enrolled', ...guard, authorizeRoles('student'), getEnrolledCourses);
router.get('/:id', protect, getCourseById);
router.post('/', ...guard, authorizeRoles('mentor'), createCourse);
router.put('/:id', ...guard, authorizeRoles('mentor', 'admin'), updateCourse);
router.delete('/:id', ...guard, authorizeRoles('mentor', 'admin'), deleteCourse);
router.patch('/:id/approve', ...guard, authorizeRoles('admin'), approveCourse);
router.patch('/:id/reject', ...guard, authorizeRoles('admin'), rejectCourse);

module.exports = router;
