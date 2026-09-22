const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkApproval } = require('../middleware/approvalMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /api/upload/file  — upload a single file (video or document)
router.post(
  '/file',
  protect, checkBlock, checkApproval,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${
      req.file.mimetype.startsWith('video/') ? 'videos' : 'files'
    }/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  }
);

module.exports = router;
