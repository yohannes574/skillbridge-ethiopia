const MentorReview = require('../models/MentorReview');
const User = require('../models/User');

// @desc   Submit a rating/review for a mentor after course completion
// @route  POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { mentorId, courseId, rating, comment } = req.body;

    if (!mentorId || !courseId || !rating) {
      return res.status(400).json({ success: false, message: 'mentorId, courseId and rating are required' });
    }

    const existing = await MentorReview.findOne({
      mentorId, studentId: req.user._id, courseId,
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already rated this mentor for this course' });
    }

    const review = await MentorReview.create({
      mentorId,
      studentId: req.user._id,
      courseId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment,
    });

    // Recalculate mentor's average rating
    const allReviews = await MentorReview.find({ mentorId });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(mentorId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get reviews for a mentor
// @route  GET /api/reviews/mentor/:mentorId
const getMentorReviews = async (req, res) => {
  try {
    const reviews = await MentorReview.find({ mentorId: req.params.mentorId })
      .populate('studentId', 'name avatar')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Check if student has reviewed this mentor for a course
// @route  GET /api/reviews/check?mentorId=&courseId=
const checkReview = async (req, res) => {
  try {
    const { mentorId, courseId } = req.query;
    const review = await MentorReview.findOne({ mentorId, courseId, studentId: req.user._id });
    res.json({ success: true, hasReviewed: !!review, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReview, getMentorReviews, checkReview };
