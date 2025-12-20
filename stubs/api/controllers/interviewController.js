// backend/src/controllers/interviewController.js
const { mockDB } = require('../mockData');
const interviewLogic = require('../service/interviewLogicService');
const stateService = require('../service/interviewStateService');

class InterviewController {
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;

      // 1. Получаем сессию из БД
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        // Теоретически middleware не пустит сюда без сессии, но для надежности:
        return res.status(404).json({ success: false, error: 'Session not found in DB' });
      }

      // 2. Получаем состояние AI (если есть)
      let aiState = await stateService.getSession(sessionId);

      // Если в памяти нет, но в БД есть - восстанавливаем/инициализируем
      if (!aiState) {
        console.log(`🤖 Re-initializing AI session for ${sessionId}`);
        await interviewLogic.initializeSession(sessionId, session.position || 'frontend');
        aiState = await stateService.getSession(sessionId);
      } else {
        // Синхронизация позиции
        if (aiState.position !== session.position) {
          aiState.position = session.position;
          await stateService.updateSession(sessionId, aiState);
        }
      }

      // 3. Получаем прогресс
      const progress = interviewLogic.getInterviewProgress(sessionId); // Этот метод внутри вызывает stateService.getSession

      res.json({
        success: true,
        session,
        aiState: aiState ? {
          hasActiveSession: true,
          topic: aiState.currentTopic,
          messageCount: aiState.conversationHistory?.length || 0,
          position: aiState.position
        } : null,
        progress: await progress // getInterviewProgress теперь может быть async в зависимости от реализации
      });

    } catch (error) {
      console.error('❌ Error in getSession:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateNotes(req, res) {
    try {
      const { sessionId } = req.params;
      const { notes } = req.body;

      const session = mockDB.sessions.find(s => s.id === sessionId);
      if (session) {
        session.notes = notes || '';
      }

      res.json({ success: true, session, message: 'Notes updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async handleConversation(req, res) {
    try {
      const { sessionId } = req.params;
      const { message, position = 'frontend' } = req.body;

      const aiResponse = await interviewLogic.getAIResponse(message, position, sessionId);

      if (aiResponse.metadata?.isInterviewComplete) {
        // Обновляем статус в БД
        const session = mockDB.sessions.find(s => s.id === sessionId);
        if (session) {
          session.status = 'completed';
          session.completedAt = new Date().toISOString();
          session.finalReport = aiResponse.metadata.finalReport;
        }
      }

      // Получаем историю для ответа
      const state = await stateService.getSession(sessionId);

      res.json({
        success: true,
        assistantResponse: aiResponse.text,
        conversation: state ? state.conversationHistory : [],
        metadata: aiResponse.metadata,
        interviewCompleted: !!aiResponse.metadata?.isInterviewComplete
      });
    } catch (error) {
      console.error('Conversation Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getConversationHistory(req, res) {
    try {
      const { sessionId } = req.params;

      // Используем stateService напрямую
      const conversationHistory = await stateService.getConversationHistory(sessionId);
      const progress = await interviewLogic.getInterviewProgress(sessionId);
      const hasSession = await stateService.hasSession(sessionId);
      const state = await stateService.getSession(sessionId);

      // Если активной сессии нет, проверяем отчет
      if (conversationHistory.length === 0) {
        const report = await stateService.getReport(sessionId);
        if (report) {
          return res.json({
            success: true,
            conversation: [],
            report: report,
            interviewCompleted: true
          });
        }
      }

      res.json({
        success: true,
        conversation: conversationHistory,
        progress: progress || {},
        hasActiveSession: hasSession,
        currentTopic: state?.currentTopic || 'не начато'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async completeInterview(req, res) {
    try {
      const { sessionId } = req.params;

      const finalReport = await interviewLogic.generateComprehensiveReport(sessionId);

      const session = mockDB.sessions.find(s => s.id === sessionId);
      if (session) {
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
        session.finalReport = finalReport;
      }

      res.json({
        success: true,
        session,
        finalReport,
        message: 'Interview completed'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUserSessions(req, res) {
    try {
      const { userId } = req.params;
      const userSessions = mockDB.sessions.filter(s => s.candidateId === userId);

      // Обогащаем данными о состоянии AI
      const sessionsWithState = await Promise.all(userSessions.map(async (session) => {
        const aiState = await stateService.getSession(session.id);
        return {
          ...session,
          aiActive: !!aiState,
          topic: aiState?.currentTopic,
          messageCount: aiState?.conversationHistory?.length || 0
        };
      }));

      res.json({ success: true, sessions: sessionsWithState });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createSession(req, res) {
    try {
      const { userId, position = 'frontend', title } = req.body;

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newSession = {
        id: sessionId,
        title: title || `Собеседование ${position}`,
        position,
        difficulty: 'middle',
        status: 'active',
        candidateId: userId,
        interviewerId: 'ai_interviewer',
        createdAt: new Date().toISOString(),
        notes: '',
        conversationHistory: []
      };

      mockDB.sessions.push(newSession);

      // Инициализируем AI
      const greeting = await interviewLogic.initializeSession(sessionId, position);

      res.status(201).json({
        success: true,
        session: newSession,
        greeting: greeting.text,
        sessionId
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getNotes(req, res) {
    try {
      const { sessionId } = req.params;
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

      res.json({ success: true, notes: session.notes || '' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getFinalReport(req, res) {
    try {
      const { sessionId } = req.params;

      // 1. Проверяем в AI сервисе
      let report = await stateService.getReport(sessionId);

      // 2. Если нет, проверяем в БД
      if (!report) {
        const session = mockDB.sessions.find(s => s.id === sessionId);
        if (session && session.finalReport) {
          report = session.finalReport;
        }
      }

      if (!report) {
        return res.status(404).json({ success: false, error: 'Report not found' });
      }

      res.json({ success: true, report });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async debugSessions(req, res) {
    try {
      const sessions = await stateService.getAllSessions();
      const sessionsArray = Array.from(sessions.entries());

      res.json({
        activeSessionsCount: sessions.size,
        sessions: sessionsArray.map(([id, state]) => ({
          id,
          position: state.position,
          messages: state.conversationHistory?.length
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Сохранение результата практического задания
  async saveCodeTaskResult(req, res) {
    try {
      const { sessionId } = req.params;
      const { score, allTestsPassed, completedAt } = req.body;

      console.log(`📊 Сохранение результата практического задания для сессии ${sessionId}:`, {
        score,
        allTestsPassed,
        completedAt
      });

      // Проверяем существование сессии
      const session = mockDB.sessions.find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Сохраняем результат в сессию
      if (!session.codeTaskResults) {
        session.codeTaskResults = [];
      }

      session.codeTaskResults.push({
        score,
        allTestsPassed,
        completedAt: completedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString()
      });

      console.log(`✅ Результат практического задания сохранен для сессии ${sessionId}`);

      res.json({
        success: true,
        message: 'Результат практического задания сохранен',
        score,
        allTestsPassed
      });
    } catch (error) {
      console.error('❌ Ошибка при сохранении результата практического задания:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new InterviewController();