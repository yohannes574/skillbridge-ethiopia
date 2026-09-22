const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const notifyAdmins = require('../utils/notifyAdmins');

const buildAuthPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isApproved: user.isApproved,
  avatar: user.avatar,
  bio: user.bio,
  skills: user.skills,
});

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!['student', 'mentor', 'employer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const user = await User.create({ name, email, password, role });

    if (role === 'mentor' || role === 'employer') {
      await notifyAdmins({
        type: 'general',
        title: `New ${role === 'mentor' ? 'Mentor' : 'Employer'} Registration`,
        message: `${name} has registered and is awaiting approval.`,
        link: '/admin/users'
      });
    }

    // Issue a token for ALL roles so everyone can access their dashboard.
    // isApproved=false for mentors/employers — the dashboard shows a pending banner.
    res.status(201).json({
      success: true,
      message:
        role === 'student'
          ? 'Account created! Welcome to SkillBridge 🎉'
          : 'Registration submitted! You can explore your dashboard while we review your account.',
      token: generateToken(user._id),
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user including admin
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });
    }
    // Note: unapproved mentors/employers CAN log in — the dashboard shows a pending banner.

    res.json({
      success: true,
      token: generateToken(user._id),
      data: buildAuthPayload(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login/register user with Google
// @route   POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    if (!googleClientId) {
      return res.status(500).json({ success: false, message: 'Google sign-in is not configured on the server' });
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ success: false, message: 'Google account verification failed' });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
      // Default role for social sign-in is student.
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        password: crypto.randomBytes(24).toString('hex'),
        role: 'student',
        avatar: payload.picture || '',
      });
    } else if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
      await user.save();
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact admin.' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      data: buildAuthPayload(user),
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      skills,
      avatar,
      githubUrl,
      portfolioUrl,
      yearsOfExperience,
      experienceLevel,
    } = req.body;

    const updates = {};

    if (typeof name === 'string') updates.name = name.trim();
    if (typeof bio === 'string') updates.bio = bio;
    if (Array.isArray(skills)) {
      updates.skills = skills
        .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
        .filter(Boolean);
    }
    if (typeof avatar === 'string') updates.avatar = avatar;
    if (typeof githubUrl === 'string') updates.githubUrl = githubUrl.trim();
    if (typeof portfolioUrl === 'string') updates.portfolioUrl = portfolioUrl.trim();
    if (typeof yearsOfExperience === 'number' && yearsOfExperience >= 0) {
      updates.yearsOfExperience = yearsOfExperience;
    }
    if (['Beginner', 'Intermediate', 'Advanced'].includes(experienceLevel)) {
      updates.experienceLevel = experienceLevel;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address. Please check your email and try again.' });
    }

    // Check if user account is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'This account has been blocked. Please contact support.' });
    }

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const text = `You requested a password reset for SkillBridge. Use this link within 30 minutes: ${resetUrl}`;
    const html = `
      <p>You requested a password reset for SkillBridge.</p>
      <p>Click the link below to set a new password. This link expires in 30 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `;

    await sendEmail({
      to: user.email,
      subject: 'SkillBridge Password Reset',
      text,
      html,
    });

    res.json({ success: true, message: `Password reset link has been sent to ${user.email}. Please check your inbox.` });
  } catch (error) {
    console.error('❌ Forgot password error:', error.message, error);
    // If mail send fails, invalidate any generated reset token for safety.
    if (req.body?.email) {
      const existingUser = await User.findOne({ email: String(req.body.email).toLowerCase().trim() });
      if (existingUser) {
        existingUser.passwordResetTokenHash = null;
        existingUser.passwordResetExpiresAt = null;
        existingUser.passwordResetUsedAt = null;
        await existingUser.save({ validateBeforeSave: false });
      }
    }

    res.status(503).json({
      success: false,
      message: 'Password reset email service is currently unavailable. Please try again later.',
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
      passwordResetUsedAt: null,
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
    }

    user.password = password;
    user.passwordResetUsedAt = new Date();
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, googleLogin, getMe, updateProfile, forgotPassword, resetPassword };
