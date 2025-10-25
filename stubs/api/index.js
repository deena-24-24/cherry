const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const hrRoutes = require('./routes/hrRoutes');
// const chatRoutes = require('./routes/chatRoutes'); // Раскомментируйте, когда будет готово
// const interviewRoutes = require('./routes/interviewRoutes'); // Раскомментируйте, когда будет готово

// Создаем экземпляр приложения Express
const app = express();

// Настройка middleware
app.use(cors()); // Включаем CORS для всех маршрутов, чтобы клиент мог отправлять запросы
app.use(express.json()); // Позволяет приложению парсить JSON-тела запросов

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/careerup';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Успешное подключение к MongoDB'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));


// --- ОСНОВНЫЕ МАРШРУТЫ ПРИЛОЖЕНИЯ ---
app.use('/api/authRoutes', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/hr', hrRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/interview', interviewRoutes);


app.get('/', (req, res) => {
  res.send('Сервер CareerUp успешно запущен!');
});

// --- ЗАПУСК СЕРВЕРА ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;