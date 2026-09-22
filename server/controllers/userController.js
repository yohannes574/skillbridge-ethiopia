const User = require('../models/User');
const MentorReview = require('../models/MentorReview');

// @desc   Get all users (admin)
// @route  GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const { role, isApproved } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single user
// @route  GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Submit onboarding profile (mentor or employer)
// @route  POST /api/users/submit-profile
const submitProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!['mentor', 'employer'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Only mentors and employers can submit profiles' });
    }

    user.profileSubmission = req.body;
    user.submissionStatus = 'submitted';
    user.rejectionReason = '';

    // Mirror mentor profile fields to root-level fields immediately so they're accessible globally
    if (user.role === 'mentor') {
      if (req.body.skills && Array.isArray(req.body.skills)) {
        user.skills = req.body.skills;
      }
      if (req.body.yearsOfExperience) {
        // Parse numeric value from strings like "3-5 years" → 3
        const parsed = parseInt(String(req.body.yearsOfExperience));
        if (!isNaN(parsed)) user.yearsOfExperience = parsed;
      }
      if (req.body.professionalBackground) {
        user.bio = req.body.professionalBackground;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile submitted for admin review',
      data: { submissionStatus: user.submissionStatus },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Approve user (admin)
// @route  PATCH /api/users/:id/approve
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isApproved = true;
    user.submissionStatus = 'approved';
    user.rejectionReason = '';

    // Sync profileSubmission fields to root-level for mentors (fixes existing mentors with data in profileSubmission)
    if (user.role === 'mentor' && user.profileSubmission) {
      const ps = user.profileSubmission;
      if (ps.skills && Array.isArray(ps.skills) && ps.skills.length > 0) {
        user.skills = ps.skills;
      }
      if (ps.yearsOfExperience) {
        const parsed = parseInt(String(ps.yearsOfExperience));
        if (!isNaN(parsed)) user.yearsOfExperience = parsed;
      }
      if (ps.professionalBackground && !user.bio) {
        user.bio = ps.professionalBackground;
      }
    }

    await user.save();
    res.json({ success: true, message: 'User approved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Reject user with reason (admin)
// @route  PATCH /api/users/:id/reject
const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        submissionStatus: 'rejected',
        rejectionReason: reason || 'Your application was rejected. Please resubmit with complete information.',
      },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User rejected', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Block / Unblock user (admin)
// @route  PATCH /api/users/:id/block
const toggleBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot block admin' });

    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete user (admin)
// @route  DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' });

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get approved mentors (public)
// @route  GET /api/users/mentors
const getMentors = async (req, res) => {
  try {
    const rawMentors = await User.find({ role: 'mentor', isApproved: true, isBlocked: false })
      .select('name email avatar bio skills yearsOfExperience rating reviewCount profileSubmission');

    // Merge profileSubmission data as fallback
    const mentors = rawMentors.map(m => {
      const obj = m.toObject();
      const ps = obj.profileSubmission || {};
      if ((!obj.skills || obj.skills.length === 0) && ps.skills?.length > 0) obj.skills = ps.skills;
      if (!obj.yearsOfExperience && ps.yearsOfExperience) {
        const parsed = parseInt(String(ps.yearsOfExperience));
        obj.yearsOfExperience = isNaN(parsed) ? 0 : parsed;
      }
      if (!obj.bio && ps.professionalBackground) obj.bio = ps.professionalBackground;
      obj.currentRole = ps.currentRole || ps.role || '';
      delete obj.profileSubmission;
      return obj;
    });

    // Attach 2 most recent reviews for each mentor
    await Promise.all(mentors.map(async (m) => {
      const reviews = await MentorReview.find({ mentorId: m._id })
        .populate('studentId', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(2)
        .lean();
      m.recentReviews = reviews.map(r => ({
        studentName: r.studentId?.name || 'Student',
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.createdAt,
      }));
    }));

    res.json({ success: true, data: mentors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   One-time migration: sync all approved mentors' profileSubmission → root fields
// @route  POST /api/users/sync-mentor-profiles (admin only)
const syncMentorProfiles = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', profileSubmission: { $ne: null } });
    let updated = 0;
    for (const mentor of mentors) {
      const ps = mentor.profileSubmission;
      if (!ps) continue;
      let changed = false;
      if (ps.skills?.length > 0 && mentor.skills.length === 0) {
        mentor.skills = ps.skills;
        changed = true;
      }
      if (ps.yearsOfExperience && !mentor.yearsOfExperience) {
        const parsed = parseInt(String(ps.yearsOfExperience));
        if (!isNaN(parsed)) { mentor.yearsOfExperience = parsed; changed = true; }
      }
      if (ps.professionalBackground && !mentor.bio) {
        mentor.bio = ps.professionalBackground;
        changed = true;
      }
      if (changed) { await mentor.save(); updated++; }
    }
    res.json({ success: true, message: `Synced ${updated} mentor(s)` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllUsers, getUserById, submitProfile, approveUser, rejectUser, toggleBlock, deleteUser, getMentors, syncMentorProfiles };
