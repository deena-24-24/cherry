const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { auth } = require('../middleware/authMiddleware');

// Создание сессии интервью
router.post('/sessions', interviewController.createSession);

// Получение сессии по ID
router.get('/sessions/:sessionId', interviewController.getSession);

// Обновление заметок (требует авторизации)
router.post('/sessions/:sessionId/notes', auth, interviewController.updateNotes);

// Получение заметок
router.get('/sessions/:sessionId/notes', interviewController.getNotes);

// Получение истории диалога
router.get('/sessions/:sessionId/history', interviewController.getConversationHistory);

// Завершение интервью (требует авторизации)
router.put('/sessions/:sessionId/complete', auth, interviewController.completeInterview);

// Получение сессий пользователя
router.get('/users/:userId/sessions', interviewController.getUserSessions);

// НОВЫЕ МАРШРУТЫ ДЛЯ ДИАЛОГА:
// Обработка сообщений в диалоге
router.post('/sessions/:sessionId/conversation', interviewController.handleConversation);

// Получение истории диалога
router.get('/sessions/:sessionId/conversation', interviewController.getConversationHistory);

module.exports = router;