// routes/hrRoutes.js
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/profileController');
const { getHr, updateHr } = require('../controllers/hrController');
const { getCandidates } = require('../controllers/candidatesController');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favoritesController');

// Единый endpoint для получения всех данных HR
router.get('/', auth, requireRole(['hr']), getHr);

// Единый endpoint для обновления всех данных HR
router.put('/', auth, requireRole(['hr']), updateHr);

// Получение профиля HR (для обратной совместимости)
router.get('/profile', auth, requireRole(['hr']), getProfile);

// Обновление профиля HR (для обратной совместимости)
router.put('/profile', auth, requireRole(['hr']), updateProfile);

// Получение списка всех кандидатов
router.get('/candidates', auth, requireRole(['hr']), getCandidates);

// Работа с избранными кандидатами
router.get('/favorites', auth, requireRole(['hr']), getFavorites);
router.post('/favorites/:candidateId', auth, requireRole(['hr']), addFavorite);
router.delete('/favorites/:candidateId', auth, requireRole(['hr']), removeFavorite);

module.exports = router;