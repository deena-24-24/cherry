const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { auth } = require('../middleware/authMiddleware');

// Все маршруты ниже требуют аутентификации

// Получить список всех чатов для текущего пользователя
router.get('/chats', auth, hrController.getConversations);

// Получить полную историю сообщений одного чата по его ID
router.get('/chats/:chatId', auth, hrController.getConversationById);

// Отправить сообщение в чат
router.post('/chats/:chatId/message', auth, hrController.sendMessage);

module.exports = router;