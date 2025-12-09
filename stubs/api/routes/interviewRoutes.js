// stubs/api/routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { auth } = require('../middleware/authMiddleware');
const { validateSessionExists } = require('../middleware/interviewMiddleware');

// stubs/api/routes/interviewRoutes.js
// Добавь в начало, перед другими маршрутами
router.get('/debug/sessions/:sessionId/check', (req, res) => {
  const { sessionId } = req.params;
  const { mockDB } = require('../mockData');
  const interviewAI = require('../service/interviewAI');

  const sessionInDB = mockDB.sessions.find(s => s.id === sessionId);
  const sessionInAI = interviewAI.conversationStates.get(sessionId);

  res.json({
    sessionId,
    exists: {
      mockDB: sessionInDB ? 'YES' : 'NO',
      conversationStates: sessionInAI ? 'YES' : 'NO',
      evaluationHistory: interviewAI.evaluationHistory.has(sessionId) ? 'YES' : 'NO'
    },
    mockDB: sessionInDB ? {
      id: sessionInDB.id,
      title: sessionInDB.title,
      position: sessionInDB.position,
      status: sessionInDB.status
    } : null,
    aiState: sessionInAI ? {
      position: sessionInAI.position,
      currentTopic: sessionInAI.currentTopic,
      conversationHistoryLength: sessionInAI.conversationHistory?.length || 0
    } : null
  });
});
// Основные маршруты сессий
// Создание сессии интервью
router.post('/sessions', interviewController.createSession);
// Получение сессии по ID
router.get('/sessions/:sessionId', validateSessionExists, interviewController.getSession);
// Завершение интервью (требует авторизации)
router.put('/sessions/:sessionId/complete', validateSessionExists, auth, interviewController.completeInterview);

// Заметки
// Обновление заметок (требует авторизации)
router.post('/sessions/:sessionId/notes', validateSessionExists, auth, interviewController.updateNotes);
router.get('/sessions/:sessionId/notes', validateSessionExists, interviewController.getNotes);

// Диалог и история
// Обработка сообщений в диалоге
router.post('/sessions/:sessionId/conversation', validateSessionExists, interviewController.handleConversation);
router.get('/sessions/:sessionId/conversation', validateSessionExists, interviewController.getConversationHistory);

// Получение сессий пользователя
router.get('/users/:userId/sessions', interviewController.getUserSessions);

// Получение финального отчета
router.get('/sessions/:sessionId/report', validateSessionExists, interviewController.getFinalReport);

// Дебаг эндпоинт (только для разработки)
router.get('/debug/sessions', interviewController.debugSessions);

module.exports = router;