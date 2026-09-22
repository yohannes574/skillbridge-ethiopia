const checkBlock = (req, res, next) => {
  if (req.user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been blocked. Please contact admin.',
    });
  }
  next();
};

module.exports = { checkBlock };
