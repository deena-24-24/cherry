const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
// const candidateRoutes = require('./routes/candidateRoutes');
// const hrRoutes = require('./routes/hrRoutes');
// const chatRoutes = require('./routes/chatRoutes'); // Раскомментируйте, когда будет готово
const interviewRoutes = require('./routes/interviewRoutes'); // Раскомментируйте, когда будет готово
const codeRoutes = require('./routes/codeRoutes'); // Новый роут

// Создаем экземпляр приложения Express
const app = express();
const server = createServer(app); // Создаем HTTP сервер для Socket.io
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8099';
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN, // URL фронтенда (brojs порт 8099)
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// --- ОСНОВНЫЕ МАРШРУТЫ ПРИЛОЖЕНИЯ ---
app.use('/api/auth', authRoutes);
// app.use('/api/chat', chatRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/code', codeRoutes);


app.get('/', (req, res) => {
  res.send('Сервер CareerUp успешно запущен!');
});

// --- WebSocket ДЛЯ ИНТЕРВЬЮ (НЕ МЕШАЕТ СУЩЕСТВУЮЩИМ ФУНКЦИЯМ) ---
const { InterviewService } = require('./services/InterviewService');
const interviewService = new InterviewService();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-interview', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on('audio-chunk', async (data) => {
    try {
      const { sessionId, chunk, position = 'frontend' } = data;

      const result = await interviewService.processAudioInteraction(
        sessionId,
        chunk,
        position
      );

      io.to(sessionId).emit('ai-audio-response', {
        text: result.textResponse,
        audio: result.audioResponse,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      socket.emit('error', { message: 'Audio processing failed' });
    }
  });

  socket.on('user-transcript', async (data) => {
    try {
      const { sessionId, text } = data;
      const result = await interviewService.processAudioInteraction(
        sessionId,
        Buffer.from(text || ''),
        'transcript'
      );
      io.to(sessionId).emit('ai-audio-response', {
        text: `Вы сказали: "${text}". ${result.textResponse}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling transcript:', error);
      socket.emit('error', { message: 'Transcript processing failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- ЗАПУСК СЕРВЕРА ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { // Меняем app.listen на server.listen
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`🔊 WebSocket для интервью доступен на ws://localhost:${PORT}`);
});

module.exports = app;