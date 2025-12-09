// stubs/api/middleware/interviewMiddleware.js
const { mockDB } = require('../mockData');
const interviewAI = require('../service/interviewAI');

/**
 * Middleware для проверки существования сессии интервью.
 * Создает сессию, если ее нет - ЭТО КЛЮЧЕВАЯ ЛОГИКА!
 */
const validateSessionExists = (req, res, next) => {
  const { sessionId } = req.params;

  console.log(`🔍 [validateSessionExists] Проверяем сессию ${sessionId}`);
  console.log(`📊 Полный URL: ${req.originalUrl}`);
  console.log(`📊 Путь (req.path): ${req.path}`);
  console.log(`📊 Базовый путь (req.baseUrl): ${req.baseUrl}`);

  // 1. Проверяем в mockDB
  let sessionInDB = mockDB.sessions.find(s => s.id === sessionId);

  // 2. Проверяем в AI сервисе (активное состояние)
  const sessionInAI = interviewAI.conversationStates.has(sessionId);

  // 3. Проверяем в истории оценок AI (завершенные сессии)
  const sessionInHistory = interviewAI.evaluationHistory.has(sessionId);

  // Если сессия есть хотя бы в одном месте - пропускаем
  if (sessionInDB || sessionInAI || sessionInHistory) {
    console.log(`✅ Сессия ${sessionId} найдена, пропускаем запрос`);
    return next();
  }

  // 4. Если это GET запрос на получение сессии - СОЗДАЕМ ЕЕ!
  // Важно: req.path будет "/sessions/:sessionId", а не "/api/interview/sessions/:sessionId"
  if (req.method === 'GET' && req.path.endsWith(`/sessions/${sessionId}`)) {
    console.log(`🆕 GET запрос на несуществующую сессию ${sessionId} - СОЗДАЕМ`);

    // Создаем базовую сессию в mockDB
    const newSession = {
      id: sessionId,
      title: `Собеседование на Frontend разработчика`,
      position: 'frontend', // default позиция
      difficulty: 'middle',
      status: 'active',
      candidateId: 'unknown',
      interviewerId: 'ai_interviewer',
      createdAt: new Date().toISOString(),
      notes: '',
      conversationHistory: []
    };

    mockDB.sessions.push(newSession);
    console.log(`📝 Создана новая сессия в mockDB: ${sessionId}`);

    // Инициализируем в AI сервисе (если нужно)
    try {
      interviewAI.initializeSession(sessionId, 'frontend');
      console.log(`🤖 Инициализирована AI сессия: ${sessionId}`);
    } catch (error) {
      console.log(`⚠️ AI сессия уже существует или ошибка: ${error.message}`);
    }

    return next();
  }

  // 5. Для всех остальных запросов (POST, PUT и т.д.) - 404
  console.log(`❌ Сессия ${sessionId} не найдена ни в одном источнике`);
  return res.status(404).json({
    success: false,
    error: 'Interview session not found',
    details: {
      sessionId,
      availableInMockDB: mockDB.sessions.map(s => s.id),
      availableInAI: Array.from(interviewAI.conversationStates.keys()),
      reqPath: req.path,
      reqOriginalUrl: req.originalUrl
    }
  });
};

module.exports = {
  validateSessionExists,
};