const express = require('express');
const router  = express.Router();
const {
  requestCertificate,
  mentorRespondToCert,
  adminRespondToCert,
  getCertificateRequests,
  getMyCertificates,
  viewCertificate,
  getCertifiedStudents,
} = require('../controllers/certificateController');
const { protect }         = require('../middleware/authMiddleware');
const { authorizeRoles }  = require('../middleware/roleMiddleware');
const { checkApproval }   = require('../middleware/approvalMiddleware');
const { checkBlock }      = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock, checkApproval];

router.get('/students', ...guard, authorizeRoles('employer', 'admin'), getCertifiedStudents);
router.get('/mine',     ...guard, authorizeRoles('student'), getMyCertificates);
router.get('/requests', ...guard, authorizeRoles('student', 'mentor', 'admin'), getCertificateRequests);
router.post('/request', ...guard, authorizeRoles('student'), requestCertificate);

// Stage 1: Mentor approves/rejects
router.patch('/request/:id/mentor', ...guard, authorizeRoles('mentor'), mentorRespondToCert);
// Stage 2: Admin approves/rejects (after mentor approved)
router.patch('/request/:id/admin',  ...guard, authorizeRoles('admin'),  adminRespondToCert);

router.get('/:id/view', viewCertificate);

module.exports = router;
