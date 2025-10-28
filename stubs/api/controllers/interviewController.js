const InterviewSession = require('../models/InterviewSession');
const { InterviewService } = require('../services/InterviewService');

const interviewService = new InterviewService();

class InterviewController {
  // Создание сессии интервью
  async createSession(req, res) {
    try {
      const {
        title,
        position,
        difficulty,
        candidateId,
        interviewerId,
        scheduledAt,
        duration
      } = req.body;

      const session = new InterviewSession({
        title,
        position,
        difficulty,
        candidateId,
        interviewerId,
        scheduledAt,
        duration
      });

      await session.save();

      // Создаем сессию в InterviewService
      interviewService.createSession({
        id: session._id.toString(),
        title,
        position,
        difficulty
      });

      res.status(201).json({
        success: true,
        session
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение сессии по ID
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await InterviewSession.findById(sessionId)
        .populate('candidateId', 'name email')
        .populate('interviewerId', 'name email');

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        session
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Обновление заметок
  async updateNotes(req, res) {
    try {
      const { sessionId } = req.params;
      const { notes } = req.body;

      const session = await InterviewSession.findByIdAndUpdate(
        sessionId,
        { notes },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Сохраняем заметки в InterviewService
      interviewService.saveNotes(sessionId, notes);

      res.json({
        success: true,
        session
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение заметок
  async getNotes(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await InterviewSession.findById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        notes: session.notes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение истории диалога
  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await InterviewSession.findById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        history: session.conversationHistory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Завершение интервью
  async completeInterview(req, res) {
    try {
      const { sessionId } = req.params;
      const { evaluation } = req.body;

      const session = await InterviewSession.findByIdAndUpdate(
        sessionId,
        {
          status: 'completed',
          evaluation
        },
        { new: true }
      );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        session
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение всех сессий пользователя
  async getUserSessions(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.query; // 'candidate' или 'interviewer'

      const filter = role === 'candidate'
        ? { candidateId: userId }
        : { interviewerId: userId };

      const sessions = await InterviewSession.find(filter)
        .populate('candidateId', 'name email')
        .populate('interviewerId', 'name email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        sessions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new InterviewController();