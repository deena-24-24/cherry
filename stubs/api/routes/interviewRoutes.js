const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// Создание сессии интервью
router.post('/sessions', interviewController.createSession);

// Получение сессии по ID
router.get('/sessions/:sessionId', interviewController.getSession);

// Обновление заметок
router.put('/sessions/:sessionId/notes', interviewController.updateNotes);

// Получение заметок
router.get('/sessions/:sessionId/notes', interviewController.getNotes);

// Получение истории диалога
router.get('/sessions/:sessionId/history', interviewController.getConversationHistory);

// Завершение интервью
router.put('/sessions/:sessionId/complete', interviewController.completeInterview);

// Получение сессий пользователя
router.get('/users/:userId/sessions', interviewController.getUserSessions);

module.exports = router;