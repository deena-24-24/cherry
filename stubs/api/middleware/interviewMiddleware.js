const { mockDB } = require('../mockData');
const interviewLogic = require('../service/interviewLogicService');
const stateService = require('../service/interviewStateService');

/**
 * Middleware для проверки существования сессии интервью.
 */
const validateSessionExists = async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    // 1. Проверяем в mockDB (база данных)
    const sessionInDB = mockDB.sessions.find(s => s.id === sessionId);

    // 2. Проверяем в stateService (активная память)
    const sessionInAI = await stateService.hasSession(sessionId);

    // 3. Проверяем в stateService (история отчетов)
    const sessionInHistory = await stateService.hasReport(sessionId);

    // Если сессия есть хотя бы в одном месте - пропускаем
    if (sessionInDB || sessionInAI || sessionInHistory) {
      return next();
    }

    // 4. Если это GET запрос на получение сессии - СОЗДАЕМ ЕЕ (Lazy Initialization)
    if (req.method === 'GET' && req.path.endsWith(`/sessions/${sessionId}`)) {
      // Создаем запись в БД
      const newSession = {
        id: sessionId,
        title: `Собеседование на Frontend разработчика`,
        position: 'frontend',
        difficulty: 'middle',
        status: 'active',
        candidateId: 'unknown',
        interviewerId: 'ai_interviewer',
        createdAt: new Date().toISOString(),
        notes: '',
        conversationHistory: []
      };
      mockDB.sessions.push(newSession);

      // Инициализируем AI состояние
      await interviewLogic.initializeSession(sessionId, 'frontend');

      return next();
    }

    // 5. Сессия не найдена
    return res.status(404).json({
      success: false,
      error: 'Interview session not found',
      details: { sessionId }
    });

  } catch (error) {
    console.error('❌ Middleware Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

module.exports = {
  validateSessionExists,
};