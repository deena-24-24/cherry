const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
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

  socket.on('join-interview', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined interview session ${sessionId}`);
  });

  socket.on('user-transcript', async (data) => {
    try {
      const { sessionId, text, position } = data;
      console.log(`Received transcript for session ${sessionId}: "${text}" (Position: ${position})`);

      const responseText = await interviewAI.getAIResponse(text, position);

      io.to(sessionId).emit('ai-audio-response', {
        text: responseText,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing transcript:', error);
      socket.emit('error', { message: 'Transcript processing failed' });
    }
  });

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

module.exports = app;