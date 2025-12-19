// stubs/api/controllers/interviewController.js
const { mockDB } = require('../mockData');
const interviewAI = require('../service/interviewAI');

class InterviewController {
  // stubs/api/controllers/interviewController.js
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;

      console.log(`📡 GET запрос на сессию: ${sessionId}`);

      // 1. Всегда создаем/проверяем в mockDB
      let session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        console.log('🆕 Создаем новую сессию в mockDB');
        session = {
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
        mockDB.sessions.push(session);
      }

      // 2. Всегда создаем/проверяем AI сессию
      let aiState = interviewAI.conversationStates.get(sessionId);

      if (!aiState) {
        console.log(`🤖 Создаем AI сессию для ${sessionId}`);
        try {
          interviewAI.initializeSession(sessionId, session.position || 'frontend');
          aiState = interviewAI.conversationStates.get(sessionId);
        } catch (error) {
          console.log(`⚠️ Ошибка создания AI сессии: ${error.message}`);
        }
      }

      const progress = interviewAI.getInterviewProgress(sessionId) || {
        totalExchanges: 0,
        averageScore: 0,
        topicsCovered: ['введение'],
        completionPercentage: 0
      };

      res.json({
        success: true,
        session,
        aiState: aiState ? {
          hasActiveSession: true,
          topic: aiState.currentTopic,
          messageCount: aiState.conversationHistory?.length || 0,
          position: aiState.position
        } : null,
        progress
      });

      console.log(`✅ Сессия ${sessionId} отправлена клиенту`);
    } catch (error) {
      console.error('❌ Ошибка в getSession:', error);
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

      let session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        // Создаем сессию с полной структурой как в mockData.js
        session = {
          id: sessionId,
          title: `Собеседование ${sessionId}`,
          position: 'Frontend Developer',
          difficulty: 'middle',
          status: 'active',
          candidateId: 'unknown',
          interviewerId: 'ai_interviewer',
          createdAt: new Date().toISOString(),
          notes: notes || '',
          conversationHistory: []
        };
        mockDB.sessions.push(session);
      } else {
        session.notes = notes || '';
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

  // Обновленный метод для обработки диалога через HTTP
  async handleConversation(req, res) {
    try {
      const { sessionId } = req.params;
      const { message, position = 'frontend' } = req.body;

      console.log(`💬 HTTP Conversation for session ${sessionId}: "${message}"`);

      // Проверяем существование сессии в БД
      const session = mockDB.sessions.find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Используем позицию из сессии, если не указана в запросе
      const interviewPosition = position || session.position;

      // Используем новый сервис
      const aiResponse = await interviewAI.getAIResponse(message, interviewPosition, sessionId);

      // Проверяем завершение интервью
      if (aiResponse.metadata?.isInterviewComplete) {
        console.log(`🏁 Interview completed via HTTP for session ${sessionId}`);

        // Обновляем статус сессии в БД
        if (session) {
          session.status = 'completed';
          session.completedAt = new Date().toISOString();
          session.finalReport = aiResponse.metadata.finalReport;
        }

        return res.json({
          success: true,
          assistantResponse: aiResponse.text,
          conversation: interviewAI.getConversationHistory(sessionId),
          interviewCompleted: true,
          finalReport: aiResponse.metadata.finalReport,
          completionReason: aiResponse.metadata.completionReason
        });
      }

      res.json({
        success: true,
        assistantResponse: aiResponse.text,
        conversation: interviewAI.getConversationHistory(sessionId),
        metadata: aiResponse.metadata,
        interviewCompleted: false
      });
    } catch (error) {
      console.error('Error in handleConversation:', error);
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

      // Проверяем существование сессии
      const session = mockDB.sessions.find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Используем новый сервис
      const conversationHistory = interviewAI.getConversationHistory(sessionId);
      const progress = interviewAI.getInterviewProgress(sessionId);
      const aiState = interviewAI.conversationStates.get(sessionId);

      // Если нет активной сессии, проверяем финальный отчет
      if (!conversationHistory || conversationHistory.length === 0) {
        const report = interviewAI.evaluationHistory.get(sessionId);
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
        conversation: conversationHistory || [],
        progress: progress || {},
        hasActiveSession: !!aiState,
        currentTopic: aiState?.currentTopic || 'не начато'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Ручное завершение собеседования
  async completeInterview(req, res) {
    try {
      const { sessionId } = req.params;

      console.log(`🛑 Manual HTTP interview completion for session ${sessionId}`);

      // Генерируем финальный отчет через новый сервис
      const finalReport = await interviewAI.generateComprehensiveReport(sessionId);

      // Обновляем статус в mockDB
      let session = mockDB.sessions.find(s => s.id === sessionId);
      if (session) {
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
        session.finalReport = finalReport;
      }

      // Очищаем состояние в AI сервисе
      if (interviewAI.conversationStates && interviewAI.conversationStates.has(sessionId)) {
        interviewAI.conversationStates.delete(sessionId);
      }

      // Получаем историю перед очисткой
      const finalHistory = interviewAI.getConversationHistory(sessionId);

      console.log(`✅ Interview completed for session ${sessionId}`);

      res.json({
        success: true,
        session,
        finalReport,
        conversationHistory: finalHistory,
        message: `Interview completed with ${finalHistory?.length || 0} messages`
      });
    } catch (error) {
      console.error('Error in completeInterview:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение сессий пользователя
  async getUserSessions(req, res) {
    try {
      const { userId } = req.params;
      const userSessions = mockDB.sessions.filter(s => s.candidateId === userId);

      // Добавляем информацию из AI-сервиса
      const sessionsWithAIState = userSessions.map(session => {
        const aiState = interviewAI.conversationStates.get(session.id);
        return {
          ...session,
          aiActive: !!aiState,
          topic: aiState?.currentTopic,
          messageCount: aiState?.conversationHistory?.length || 0
        };
      });

      res.json({
        success: true,
        sessions: sessionsWithAIState,
        count: sessionsWithAIState.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Создание сессии интервью
  async createSession(req, res) {
    try {
      const { userId, position = 'frontend', title } = req.body;

      // Проверяем существование пользователя
      const user = mockDB.users.find(u => u._id === userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Генерируем уникальный ID сессии
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newSession = {
        id: sessionId,
        title: title || `Собеседование на ${position} разработчика`,
        position: position,
        difficulty: 'middle',
        status: 'active',
        candidateId: userId,
        interviewerId: 'ai_interviewer',
        createdAt: new Date().toISOString(),
        notes: '',
        conversationHistory: []
      };

      mockDB.sessions.push(newSession);

      // Инициализируем сессию в AI-сервисе
      const greeting = interviewAI.initializeSession(sessionId, position);

      console.log(`✅ New session created: ${sessionId} for ${position}`);

      res.status(201).json({
        success: true,
        session: newSession,
        greeting: greeting?.text || "Готов начать собеседование",
        sessionId: sessionId
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
      const session = mockDB.sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      res.json({
        success: true,
        notes: session.notes || ''
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Получение финального отчета
  async getFinalReport(req, res) {
    try {
      const { sessionId } = req.params;

      // Проверяем существование сессии
      const session = mockDB.sessions.find(s => s.id === sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Проверяем в evaluationHistory нового сервиса
      const report = interviewAI.evaluationHistory.get(sessionId);

      if (!report) {
        // Если отчета нет, но сессия завершена, генерируем его
        if (session.status === 'completed' && session.finalReport) {
          return res.json({
            success: true,
            report: session.finalReport,
            fromCache: true
          });
        }

        return res.status(404).json({
          success: false,
          error: 'Report not found. Interview might still be active.'
        });
      }

      res.json({
        success: true,
        report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Дебаг информация о сессиях
  async debugSessions(req, res) {
    try {
      const debugInfo = interviewAI.debugServiceUsage();

      res.json({
        success: true,
        ...debugInfo,
        mockDBSessions: mockDB.sessions.length
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