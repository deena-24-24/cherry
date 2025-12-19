const { mockDB } = require('../mockData');
const interviewLogic = require('../service/interviewLogicService');
const stateService = require('../service/interviewStateService');

// Хелпер для сохранения финального отчета
function saveFinalReportToMockDB(sessionId, finalReport) {
  if (!finalReport) return;
  try {
    let session = mockDB.sessions.find((s) => s.id === sessionId);
    if (!session) {
      session = {
        id: sessionId,
        title: `Собеседование ${sessionId}`,
        position: 'frontend',
        difficulty: 'middle',
        status: 'completed',
        candidateId: 'unknown',
        interviewerId: 'ai_interviewer',
        createdAt: new Date().toISOString(),
        notes: '',
        conversationHistory: []
      };
      mockDB.sessions.push(session);
    }
    session.status = 'completed';
    session.completedAt = new Date().toISOString();
    session.finalReport = finalReport;
    console.log(`💾 Report saved for session ${sessionId} with score ${finalReport.overall_assessment.final_score}`);
  } catch (error) {
    console.error('DB Save Error:', error);
  }
}

module.exports = function initializeSocket(io) {
  io.on('connection', (socket) => {

    socket.on('join-interview', async (data) => {
      const { sessionId, position = 'frontend' } = data;
      socket.join(sessionId);

      try {
        const greetingData = await interviewLogic.initializeSession(sessionId, position);
        if (greetingData) {
          socket.emit('ai-audio-response', {
            text: greetingData.text,
            metadata: greetingData.metadata,
            timestamp: new Date().toISOString(),
            sessionId: sessionId
          });
        }
      } catch (error) {
        console.error('Join Error:', error);
        socket.emit('ai-error', { message: 'Ошибка инициализации', sessionId });
      }
    });

    socket.on('user-transcript', async (data) => {
      try {
        if (!data || !data.sessionId || !data.text) return;

        const { sessionId, text, position = 'frontend' } = data;

        socket.emit('ai-stream-start', { sessionId });

        // Генерация ответа ИИ
        const aiResponse = await interviewLogic.getAIResponseStream(
          text,
          position,
          sessionId,
          (chunk) => {
            socket.emit('ai-stream-chunk', { text: chunk, sessionId });
          }
        );

        socket.emit('ai-stream-end', { sessionId });

        // === ПРОВЕРКА НА АВТОМАТИЧЕСКОЕ ЗАВЕРШЕНИЕ ПОСЛЕ ОТВЕТА ИИ ===
        if (aiResponse.metadata?.isInterviewComplete) {
          console.log(`🏁 Session ${sessionId} marked as complete by AI logic`);

          // 1. СРАЗУ уведомляем фронтенд о начале завершения (блокируем интерфейс)
          socket.emit('interview-completion-started', { sessionId });
          socket.to(sessionId).emit('interview-completion-started', { sessionId });

          // 2. Генерируем финальный отчет (если он еще не был сгенерирован внутри логики)
          let finalReport = aiResponse.metadata.finalReport;

          if (!finalReport) {
            console.log('Generating report...');
            finalReport = await interviewLogic.generateComprehensiveReport(sessionId);
          }

          saveFinalReportToMockDB(sessionId, finalReport);

          // Имитируем небольшую задержку (1с) для плавности UX
          setTimeout(() => {
            const payload = {
              sessionId,
              finalReport,
              completionReason: aiResponse.metadata.completionReason || "Автоматическое завершение",
              wasAutomatic: true,
              finalText: interviewLogic.getSmartCompletionMessage(finalReport)
            };

            console.log('📤 Sending interview-completed event');
            socket.emit('interview-completed', payload);
            socket.to(sessionId).emit('interview-completed', payload);
          }, 1000);
        }

      } catch (error) {
        console.error('Transcript processing error:', error);
        socket.emit('ai-error', { message: 'Ошибка обработки ответа', sessionId: data?.sessionId });
      }
    });

    socket.on('complete-interview', async (data) => {
      try {
        const { sessionId, force = false } = data;
        console.log(`🛑 Manual completion requested for ${sessionId}`);

        // 1. уведомляем фронтенд о начале генерации
        socket.emit('interview-completion-started', { sessionId });

        if (force) {
          const fallback = interviewLogic.createMockFinalReport();
          socket.emit('interview-completed', {
            sessionId,
            finalReport: fallback,
            completionReason: "Принудительно",
            wasAutomatic: false,
            finalText: "Завершено пользователем."
          });
          return;
        }

        // 2. Генерируем отчет
        try {
          const finalReport = await interviewLogic.generateComprehensiveReport(sessionId);
          saveFinalReportToMockDB(sessionId, finalReport);

          // 3. Отправляем отчет
          socket.emit('interview-completed', {
            sessionId,
            finalReport,
            completionReason: "Ручное завершение",
            wasAutomatic: false,
            finalText: interviewLogic.getSmartCompletionMessage(finalReport)
          });
        } catch (reportError) {
          console.error("Report Generation Critical Fail:", reportError);
          // Фолбэк, чтобы фронт не завис
          const fallbackReport = interviewLogic.createMockFinalReport();
          socket.emit('interview-completed', {
            sessionId,
            finalReport: fallbackReport,
            completionReason: "Ошибка генерации (фолбэк)",
            wasAutomatic: false
          });
        }

      } catch (error) {
        console.error('Completion error:', error);
        socket.emit('ai-error', { message: 'Ошибка завершения', sessionId: data?.sessionId });
      }
    });

    socket.on('disconnect', () => {});

    socket.on('get-session-state', async (data) => {
      const state = await stateService.getSession(data.sessionId);
      if (state) {
        const progress = await interviewLogic.getInterviewProgress(data.sessionId);
        socket.emit('session-state', {
          sessionId: data.sessionId,
          conversationHistory: state.conversationHistory,
          currentTopic: state.currentTopic,
          position: state.position,
          progress: progress
        });
      } else {
        socket.emit('session-not-found', { sessionId: data.sessionId });
      }
    });
  });
};