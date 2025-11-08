const { mockDB } = require('../mockData');

class InterviewController {
  // Получение сессии по ID
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Обновление заметок
  async updateNotes(req, res) {
    try {
      const { sessionId } = req.params;
      const { notes } = req.body;
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      session.notes = notes;

      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Завершение интервью
  async completeInterview(req, res) {
    try {
      const { sessionId } = req.params;
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      session.status = 'completed';

      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Dummy functions to make routes work
  async createSession(req, res) { res.status(501).send({ success: false, error: 'Not implemented' }); }
  async getNotes(req, res) { res.status(501).send({ success: false, error: 'Not implemented' }); }
  async getConversationHistory(req, res) { res.status(501).send({ success: false, error: 'Not implemented' }); }
  async getUserSessions(req, res) { res.status(501).send({ success: false, error: 'Not implemented' }); }
}

module.exports = new InterviewController();