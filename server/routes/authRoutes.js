const express = require('express');
const router = express.Router();
const { register, login, googleLogin, getMe, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, checkBlock, getMe);
router.put('/profile', protect, checkBlock, updateProfile);

module.exports = router;
