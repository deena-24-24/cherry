const express = require('express');
const router = express.Router();
const { sendMessageToAI, getHistory } = require('../controllers/aiChatController');
const { auth } = require('../middleware/authMiddleware');

router.post('/message', auth, sendMessageToAI);
router.get('/history', auth, getHistory)

module.exports = router;