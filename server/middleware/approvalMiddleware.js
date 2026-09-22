const checkApproval = (req, res, next) => {
  if (!req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending admin approval. Please wait.',
    });
  }
  next();
};

module.exports = { checkApproval };
