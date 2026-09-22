const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');

// @desc   Get all badges
// @route  GET /api/badges
const getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort({ createdAt: -1 });
    res.json({ success: true, data: badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create badge (admin)
// @route  POST /api/badges
const createBadge = async (req, res) => {
  try {
    const { title, description, icon, color } = req.body;
    const badge = await Badge.create({ title, description, icon, color });
    res.status(201).json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update badge (admin)
// @route  PUT /api/badges/:id
const updateBadge = async (req, res) => {
  try {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });
    res.json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete badge (admin)
// @route  DELETE /api/badges/:id
const deleteBadge = async (req, res) => {
  try {
    await Badge.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Badge deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get badges for current user
// @route  GET /api/badges/mine
const getMyBadges = async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ userId: req.user._id })
      .populate('badgeId')
      .populate('courseId', 'title')
      .sort({ earnedAt: -1 });
    res.json({ success: true, data: userBadges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Assign badge to user (admin)
// @route  POST /api/badges/assign
const assignBadge = async (req, res) => {
  try {
    const { userId, badgeId, courseId } = req.body;
    const userBadge = await UserBadge.create({ userId, badgeId, courseId });
    await userBadge.populate('badgeId');
    res.status(201).json({ success: true, data: userBadge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBadges, createBadge, updateBadge, deleteBadge, getMyBadges, assignBadge };
