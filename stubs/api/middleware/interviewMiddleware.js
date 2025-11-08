const { mockDB } = require('../mockData');

/**
 * Middleware для проверки существования сессии интервью.
 * Если сессия не найдена, возвращает ошибку 404.
 */
const validateSessionExists = (req, res, next) => {
  const { sessionId } = req.params;
  const session = mockDB.sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Interview session not found' });
  }

  // Если сессия найдена, передаем управление следующему обработчику
  next();
};

module.exports = {
  validateSessionExists,
};