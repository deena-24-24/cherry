const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { cleanupOldSessions } = require('./utils/sessionCleanup');
const { mockDB } = require('./mockData');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const codeRoutes = require('./routes/codeRoutes');
const interviewAI = require('./service/interviewAI');
const chatRoutes = require('./routes/chatRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const hrRoutes = require('./routes/hrRoutes');

// Создаем экземпляр приложения Express
const app = express();
const server = createServer(app);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8099';
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT"]
  }
});

/**
 * Сохраняем финальный отчет интервью в mockDB как "моковую БД"
 * Чтобы фронтенд и другие сервисы команды могли забирать свежие результаты.
 */
function saveFinalReportToMockDB(sessionId, finalReport) {
  if (!finalReport) {
    console.warn(`⚠️ No finalReport provided for session ${sessionId}, nothing to save`);
    return;
  }

  try {
    let session = mockDB.sessions.find((s) => s.id === sessionId);

    // Если сессии нет в mockDB (например, она была создана только через AI)
    if (!session) {
      console.log(`🆕 Creating mockDB session for final report ${sessionId}`);
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

    console.log(`💾 Final report saved to mockDB for session ${sessionId}`);
  } catch (error) {
    console.error('❌ Error saving final report to mockDB:', error);
  }
}

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '50mb' }));

// --- ОСНОВНЫЕ МАРШРУТЫ ПРИЛОЖЕНИЯ ---
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/hr', hrRoutes);

app.get('/', (req, res) => {
  res.send('Сервер CareerUp успешно запущен!');
});

// --- WebSocket ДЛЯ ИНТЕРВЬЮ ---
io.on('connection', (socket) => {
  console.log('User connected via WebSocket:', socket.id);

  socket.on('join-interview', async (data) => {
    const { sessionId, position = 'frontend' } = data;
    socket.join(sessionId);
    console.log(`User ${socket.id} joined interview session ${sessionId} for ${position}`);

    try {
      // 1. Гарантируем, что сессия существует в AI
      const greetingResponse = interviewAI.initializeSession(sessionId, position);

      // 2. Получаем состояние сессии
      const state = interviewAI.conversationStates.get(sessionId);

      // 3. ОПРЕДЕЛЯЕМ, КАКОЕ СООБЩЕНИЕ ОТПРАВИТЬ
      let messageToSend = '';
      let metadata = {};

      // Вариант A: Есть приветствие от initializeSession (новая сессия)
      if (greetingResponse) {
        console.log(`🎯 New session - sending greeting`);
        messageToSend = greetingResponse.text;
        metadata = greetingResponse.metadata;
      }
      // Вариант B: Сессия уже существует
      else if (state && state.conversationHistory && state.conversationHistory.length > 0) {
        console.log(`📜 Existing session with ${state.conversationHistory.length} messages`);

        // Ищем приветственное сообщение в истории
        const greetingMessages = state.conversationHistory.filter(
          msg => msg.role === 'assistant' &&
            (msg.content.includes('Здравствуйте') || msg.content.includes('Добрый') || msg.content.includes('Привет'))
        );

        if (greetingMessages.length > 0) {
          // Используем существующее приветствие из истории
          messageToSend = greetingMessages[0].content;
          console.log(`✅ Found greeting in history: ${messageToSend.substring(0, 50)}...`);
        } else {
          // Берем последнее сообщение AI или создаем новое приветствие
          const lastAIMessage = state.conversationHistory
            .filter(msg => msg.role === 'assistant')
            .pop();

          messageToSend = lastAIMessage ? lastAIMessage.content :
            initialGreetings[position] || initialGreetings.frontend;
        }

        metadata = {
          currentTopic: state.currentTopic || 'введение',
          interviewProgress: interviewAI.getInterviewProgress(sessionId),
          isReconnecting: true
        };
      }
      // Вариант C: Нет сессии вообще (на всякий случай)
      else {
        console.log(`⚠️ No session state found, creating greeting`);
        messageToSend = initialGreetings[position] || initialGreetings.frontend;
        metadata = {
          isInitial: true,
          currentTopic: 'введение'
        };
      }

      // 4. ГАРАНТИРОВАННО отправляем сообщение
      if (messageToSend) {
        console.log(`📤 Sending greeting to user: ${messageToSend.substring(0, 100)}...`);

        socket.emit('ai-audio-response', {
          text: messageToSend,
          metadata: metadata,
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        });

        console.log(`✅ Greeting sent successfully`);
      } else {
        console.error(`❌ No message to send for session ${sessionId}`);
      }

    } catch (error) {
      console.error('Error in join-interview:', error);
      socket.emit('ai-error', {
        message: 'Ошибка инициализации сессии',
        sessionId: sessionId,
        error: error.message
      });
    }
  });

  // В server.js добавляем новый обработчик
  socket.on('get-conversation-history', (data) => {
    try {
      const { sessionId } = data;
      const history = interviewAI.getConversationHistory(sessionId);
      const state = interviewAI.conversationStates.get(sessionId);

      socket.emit('conversation-history', {
        sessionId,
        history: history || [],
        currentTopic: state?.currentTopic,
        position: state?.position,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting conversation history:', error);
    }
  });

  // ОБРАБОТЧИК ДЛЯ ТРАНСКРИПТОВ ПОЛЬЗОВАТЕЛЯ
  socket.on('user-transcript', async (data) => {
    try {
      // Проверка данных
      if (!data || !data.sessionId || !data.text) {
        console.error('❌ Invalid user-transcript data:', data);
        socket.emit('ai-error', {
          message: 'Invalid transcript data',
          sessionId: data?.sessionId
        });
        return;
      }

      const { sessionId, text, position = 'frontend' } = data;
      console.log(`🎯 Processing transcript for session ${sessionId}: "${text}" (position: ${position})`);

      // Получаем ответ от нового AI сервиса (объект с text и metadata)
      const aiResponse = await interviewAI.getAIResponse(text, position, sessionId);

      console.log(`🤖 AI Response text: ${aiResponse.text}`);

      // Проверяем метаданные на завершение интервью
      if (aiResponse.metadata?.isInterviewComplete) {
        console.log(`🏁 Interview completed for session ${sessionId}`);
        console.log(`📊 Final report generated:`, aiResponse.metadata.finalReport?.overall_assessment);

        // Сохраняем финальный отчет в mockDB как "моковую БД"
        try {
          saveFinalReportToMockDB(sessionId, aiResponse.metadata.finalReport);
        } catch (e) {
          console.error('❌ Failed to persist final report to mockDB on completion:', e);
        }

        socket.emit('interview-completed', {
          sessionId: sessionId,
          finalReport: aiResponse.metadata.finalReport,
          completionReason: aiResponse.metadata.completionReason,
          wasAutomatic: aiResponse.metadata.wasAutomatic,
          finalText: aiResponse.text // Добавляем финальный текст
        });

        // Также отправляем в комнату для других клиентов
        socket.to(sessionId).emit('interview-completed', {
          sessionId: sessionId,
          finalReport: aiResponse.metadata.finalReport,
          completionReason: aiResponse.metadata.completionReason,
          wasAutomatic: aiResponse.metadata.wasAutomatic,
          finalText: aiResponse.text
        });

        // Очистка старых сессий
        cleanupOldSessions(2);

        // Не продолжаем дальше, так как интервью завершено
        return;
      }

      // Отправляем обычный ответ обратно клиенту
      socket.emit('ai-audio-response', {
        text: aiResponse.text,
        metadata: {
          evaluation: aiResponse.metadata?.evaluation,
          nextAction: aiResponse.metadata?.nextAction,
          currentTopic: aiResponse.metadata?.currentTopic,
          interviewProgress: aiResponse.metadata?.interviewProgress,
          completionCheck: aiResponse.metadata?.completionCheck
        },
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      });

      // Также отправляем в комнату для других клиентов
      socket.to(sessionId).emit('ai-audio-response', {
        text: aiResponse.text,
        metadata: {
          evaluation: aiResponse.metadata?.evaluation,
          nextAction: aiResponse.metadata?.nextAction,
          currentTopic: aiResponse.metadata?.currentTopic
        },
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      });

    } catch (error) {
      console.error('❌ Error processing transcript:', error);
      socket.emit('ai-error', {
        message: 'Произошла ошибка при обработке ответа',
        sessionId: data?.sessionId,
        error: error.message
      });
    }
  });

  // ОБРАБОТЧИК ДЛЯ РУЧНОГО ЗАВЕРШЕНИЯ ИНТЕРВЬЮ
  socket.on('complete-interview', async (data) => {
    try {
      const { sessionId, force = false } = data;
      console.log(`🛑 Manual interview completion requested for session ${sessionId}`);

      // Если force=true, завершаем немедленно
      if (force) {
        const fallbackReport = interviewAI.createMockFinalReport();

        socket.emit('interview-completed', {
          sessionId: sessionId,
          finalReport: fallbackReport,
          completionReason: "Принудительное завершение",
          wasAutomatic: false,
          finalText: "Собеседование завершено по вашему запросу."
        });

        socket.to(sessionId).emit('interview-completed', {
          sessionId: sessionId,
          finalReport: fallbackReport,
          completionReason: "Принудительное завершение",
          wasAutomatic: false,
          finalText: "Собеседование завершено по вашему запросу."
        });

        return;
      }

      // Иначе генерируем нормальный отчет
      const finalReport = await interviewAI.generateComprehensiveReport(sessionId);

      // Сохраняем финальный отчет в mockDB
      try {
        saveFinalReportToMockDB(sessionId, finalReport);
      } catch (e) {
        console.error('❌ Failed to persist final report to mockDB on manual completion:', e);
      }

      socket.emit('interview-completed', {
        sessionId: sessionId,
        finalReport: finalReport,
        completionReason: "Ручное завершение",
        wasAutomatic: false,
        finalText: finalReport ? interviewAI.getSmartCompletionMessage(finalReport) : "Собеседование завершено."
      });

      socket.to(sessionId).emit('interview-completed', {
        sessionId: sessionId,
        finalReport: finalReport,
        completionReason: "Ручное завершение",
        wasAutomatic: false,
        finalText: interviewAI.getSmartCompletionMessage(finalReport)
      });

      console.log(`✅ Manual completion successful for session ${sessionId}`);

    } catch (error) {
      console.error('❌ Error completing interview:', error);

      // Фолбэк в случае ошибки
      const fallbackReport = interviewAI.createMockFinalReport();

      // Пытаемся сохранить и этот отчет как последний результат
      try {
        saveFinalReportToMockDB(data?.sessionId, fallbackReport);
      } catch (e) {
        console.error('❌ Failed to persist fallback final report to mockDB:', e);
      }

      socket.emit('interview-completed', {
        sessionId: data?.sessionId,
        finalReport: fallbackReport,
        completionReason: "Завершено с ошибкой",
        wasAutomatic: false,
        finalText: "Собеседование завершено. Произошла ошибка при генерации отчета."
      });
    }
  });

  // НОВЫЙ ОБРАБОТЧИК: Получение текущего состояния сессии
  socket.on('get-session-state', (data) => {
    try {
      const { sessionId } = data;
      const state = interviewAI.conversationStates.get(sessionId);

      if (state) {
        socket.emit('session-state', {
          sessionId: sessionId,
          conversationHistory: state.conversationHistory,
          currentTopic: state.currentTopic,
          position: state.position,
          progress: interviewAI.getInterviewProgress(sessionId),
          evaluationHistory: state.evaluationHistory
        });
      } else {
        socket.emit('session-not-found', {
          sessionId: sessionId,
          message: 'Сессия не найдена или не инициализирована'
        });
      }
    } catch (error) {
      console.error('Error getting session state:', error);
    }
  });

  // НОВЫЙ ОБРАБОТЧИК: Сброс сессии (для тестирования)
  socket.on('reset-session', (data) => {
    try {
      const { sessionId } = data;
      if (interviewAI.conversationStates.has(sessionId)) {
        interviewAI.conversationStates.delete(sessionId);
        console.log(`🔄 Session ${sessionId} reset`);
        socket.emit('session-reset', { sessionId: sessionId });
      }
    } catch (error) {
      console.error('Error resetting session:', error);
    }
  });

  // Обработчик отключения
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- ЗАПУСК СЕРВЕРА ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`🔊 WebSocket для интервью доступен на ws://localhost:${PORT}`);
});

console.log('🕒 Session cleanup scheduler started');

module.exports = app;