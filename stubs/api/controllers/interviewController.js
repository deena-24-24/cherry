// stubs/api/controllers/interviewController.js
const { mockDB } = require('../mockData');
const aiService = require('../service/interviewAI');

class InterviewController {
  // Получение сессии по ID
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      let session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        console.log('Creating mock session for:', sessionId);
        session = {
          id: sessionId,
          title: `Собеседование ${sessionId}`,
          position: 'Frontend Developer',
          status: 'active',
          notes: '',
          createdAt: new Date().toISOString()
        };
        mockDB.sessions.push(session);
      }

      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // ДОБАВЬТЕ ЭТОТ МЕТОД - обновление заметок
  async updateNotes(req, res) {
    try {
      const { sessionId } = req.params;
      const { notes } = req.body;

      let session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        // Если сессии нет, создаем новую
        session = {
          id: sessionId,
          title: `Собеседование ${sessionId}`,
          position: 'Frontend Developer',
          status: 'active',
          notes: notes,
          createdAt: new Date().toISOString()
        };
        mockDB.sessions.push(session);
      } else {
        // Обновляем заметки существующей сессии
        session.notes = notes;
      }

      console.log(`📝 Notes updated for session ${sessionId}`);

      res.json({
        success: true,
        session,
        message: 'Notes updated successfully'
      });
    } catch (error) {
      console.error('Error updating notes:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Обновленный метод для обработки диалога
  async handleConversation(req, res) {
    try {
      const { sessionId } = req.params;
      const { message, position = 'frontend' } = req.body;

      console.log(`💬 Handling conversation for session ${sessionId}: ${message}`);

      // Получаем ответ от AI сервиса с контекстом
      const aiResponse = await aiService.getAIResponse(message, position, sessionId);

      // Получаем обновленную историю диалога
      const conversationHistory = aiService.getConversationHistory(sessionId);

      res.json({
        success: true,
        assistantResponse: aiResponse,
        conversation: conversationHistory
      });
    } catch (error) {
      console.error('Error in handleConversation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Обновленный метод получения истории диалога
  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const conversationHistory = aiService.getConversationHistory(sessionId);

      // Также возвращаем статистику для отладки
      const stats = aiService.getSessionStats();

      res.json({
        success: true,
        conversation: conversationHistory,
        stats: stats[sessionId] || null
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Обновленный метод завершения собеседования
  async completeInterview(req, res) {
    try {
      const { sessionId } = req.params;
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      session.status = 'completed';

      // Сохраняем финальную историю в сессию перед очисткой
      const finalHistory = aiService.getConversationHistory(sessionId);
      session.conversationHistory = finalHistory;

      // Очищаем состояние диалога
      aiService.clearSessionState(sessionId);

      console.log(`✅ Interview completed for session ${sessionId}, history saved`);

      res.json({
        success: true,
        session,
        message: `Interview completed with ${finalHistory.length} messages`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Остальные методы остаются как есть
  async createSession(req, res) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }

  async getNotes(req, res) {
    try {
      const { sessionId } = req.params;
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.json({
        success: true,
        notes: session.notes || ''
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserSessions(req, res) {
    res.status(501).json({ success: false, error: 'Not implemented' });
  }
}

module.exports = new InterviewController();