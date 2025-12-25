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

// 1. Формирование списка разрешенных доменов
const allowedOrigins = [
  'http://localhost:8099',
  'https://ift-1.brojs.ru'
];

if (process.env.FRONTEND_ORIGIN) {
  const envOrigins = process.env.FRONTEND_ORIGIN.split(',').map(url => url.trim());
  envOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

// 2. Настройка Socket.io (WebSocket)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT"],
    credentials: true
  }
});

// 3. Настройка CORS для Express (HTTP API)
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

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
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins:`, allowedOrigins);
});

module.exports = app;