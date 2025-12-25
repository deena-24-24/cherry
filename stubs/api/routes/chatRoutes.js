const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/authMiddleware');

router.get('/chats', auth, chatController.getChats);
router.get('/chats/:chatId', auth, chatController.getChatById);
router.post('/chats/:chatId/message', auth, chatController.sendMessage);
router.post('/start', auth, chatController.startChat); // Создать новый чат

module.exports = router;