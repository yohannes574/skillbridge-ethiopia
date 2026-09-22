const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getContacts, getUnreadCount } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { checkBlock } = require('../middleware/blockMiddleware');

const guard = [protect, checkBlock];

router.post('/', ...guard, sendMessage);
router.get('/contacts', ...guard, getContacts);
router.get('/unread', ...guard, getUnreadCount);
router.get('/:userId', ...guard, getConversation);

module.exports = router;
