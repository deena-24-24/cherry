// stubs/utils/sessionCleanup.js
const aiService = require('../service/interviewAI');

/**
 * Очищает сессии старше указанного времени
 */
function cleanupOldSessions(maxAgeHours = 24) {
  const now = new Date();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  let cleanedCount = 0;

  aiService.conversationStates.forEach((state, sessionId) => {
    const lastMessage = state.conversationHistory[state.conversationHistory.length - 1];
    if (lastMessage && (now - new Date(lastMessage.timestamp)) > maxAgeMs) {
      aiService.clearSessionState(sessionId);
      cleanedCount++;
    }
  });

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} old sessions`);
  }
}

// Запускаем очистку каждые 6 часов
setInterval(cleanupOldSessions, 6 * 60 * 60 * 1000);

module.exports = { cleanupOldSessions };