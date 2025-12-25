require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const codeRoutes = require('./routes/codeRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const chatRoutes = require('./routes/chatRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const hrRoutes = require('./routes/hrRoutes');
const saluteRoutes = require('./routes/saluteRoutes');

// Импорт контроллера сокетов
const initializeSocket = require('./controllers/socketController');
// Импорт утилиты очистки (если нужна)
const { cleanupOldSessions } = require('./utils/sessionCleanup');

const app = express();
const server = createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8099';

// Настройка Socket.io
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT"]
  }
});

// Middleware
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '50mb' }));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/ai_chat', aiChatRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/salute', saluteRoutes);

app.get('/', (req, res) => {
  res.send('CareerUp Backend is running');
});

// Инициализация логики сокетов
initializeSocket(io);

// Запуск задач по расписанию
if (cleanupOldSessions) {
  // setInterval(cleanupOldSessions, 6 * 60 * 60 * 1000);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});

module.exports = app;