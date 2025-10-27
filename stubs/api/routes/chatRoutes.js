const express = require('express');
const router = express.Router();
const { sendMessageToAI } = require('../controllers/chatController');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/chat/message
// @desc    Отправить сообщение AI и получить ответ
// @access  Private
router.post('/message', auth, sendMessageToAI);

module.exports = router;