const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { cleanupOldSessions } = require('./utils/sessionCleanup');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const codeRoutes = require('./routes/codeRoutes');
const interviewAI = require('./service/interviewAI');
const chatRoutes = require('./routes/chatRoutes');

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

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// --- ОСНОВНЫЕ МАРШРУТЫ ПРИЛОЖЕНИЯ ---
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/chat', chatRoutes);

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
      // Инициализируем сессию и получаем приветствие
      const greeting = interviewAI.initializeSession(sessionId, position);

      if (greeting) {
        console.log(`🎯 Sending initial greeting for session ${sessionId}`);

        // Отправляем приветствие сразу при подключении
        socket.emit('ai-audio-response', {
          text: greeting,
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        });

        console.log('✅ Initial greeting sent successfully');

      } else {
        console.log('❌ No greeting generated or invalid greeting format');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  });

  // ДОБАВЛЯЕМ ОБРАБОТЧИК ДЛЯ ТРАНСКРИПТОВ ПОЛЬЗОВАТЕЛЯ
  socket.on('user-transcript', async (data) => {
    try {
      // ДОБАВЬТЕ ПРОВЕРКУ ДАННЫХ
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

      // Получаем ответ от AI (теперь это объект с metadata)
      const aiResponse = await interviewAI.getAIResponse(text, position, sessionId);

      console.log(`🤖 AI Response: ${aiResponse}`);
      // ЕСЛИ ИНТЕРВЬЮ ЗАВЕРШЕНО - отправляем специальное событие
      if (aiResponse.metadata?.isInterviewComplete) {
        console.log(`🏁 Interview completed for session ${sessionId}`);

        socket.emit('interview-completed', {
          sessionId: sessionId,
          finalReport: aiResponse.metadata.finalReport,
          completionReason: aiResponse.metadata.completionReason,
          wasAutomatic: aiResponse.metadata.wasAutomatic
        });

        // Также отправляем в комнату для других клиентов
        socket.to(sessionId).emit('interview-completed', {
          sessionId: sessionId,
          finalReport: aiResponse.metadata.finalReport,
          completionReason: aiResponse.metadata.completionReason,
          wasAutomatic: aiResponse.metadata.wasAutomatic
        });
      }

      // Отправляем ответ обратно клиенту
      socket.emit('ai-audio-response', {
        text: aiResponse.text,
        metadata: aiResponse.metadata,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      });

      // Также отправляем в комнату для других клиентов
      socket.to(sessionId).emit('ai-audio-response', {
        text: aiResponse.text,
        metadata: aiResponse.metadata,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error processing transcript:', error);
      socket.emit('ai-error', {
        message: 'Произошла ошибка при обработке ответа',
        sessionId: data?.sessionId
      });
    }
  });

  // ОБРАБОТЧИК ДЛЯ РУЧНОГО ЗАВЕРШЕНИЯ ИНТЕРВЬЮ
  socket.on('complete-interview', async (data) => {
    try {
      const { sessionId } = data;
      console.log(`🛑 Manual interview completion requested for session ${sessionId}`);

      // Генерируем финальный отчет
      const finalReport = await interviewAI.generateComprehensiveReport(sessionId);

      socket.emit('interview-completed', {
        sessionId: sessionId,
        finalReport: finalReport,
        completionReason: "Ручное завершение",
        wasAutomatic: false
      });

      socket.to(sessionId).emit('interview-completed', {
        sessionId: sessionId,
        finalReport: finalReport,
        completionReason: "Ручное завершение",
        wasAutomatic: false
      });

    } catch (error) {
      console.error('❌ Error completing interview:', error);
      socket.emit('ai-error', {
        message: 'Ошибка при завершении интервью',
        sessionId: data?.sessionId
      });
    }
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