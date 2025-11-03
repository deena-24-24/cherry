const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// --- ОСНОВНЫЕ МАРШРУТЫ ПРИЛОЖЕНИЯ ---
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Сервер CareerUp успешно запущен!');
});

// --- ЗАПУСК СЕРВERA ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});

module.exports = app;