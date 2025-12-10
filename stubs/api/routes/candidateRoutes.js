// routes/candidateRoutes.js
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/profileController');
const { getResume, updateResume } = require('../controllers/resumeController');
const { getCandidate, updateCandidate } = require('../controllers/candidateController');

// Единый endpoint для получения всех данных кандидата
router.get('/', auth, requireRole(['candidate']), getCandidate);

// Единый endpoint для обновления всех данных кандидата
router.put('/', auth, requireRole(['candidate']), updateCandidate);

// Получение профиля кандидата (для обратной совместимости)
router.get('/profile', auth, requireRole(['candidate']), getProfile);

// Обновление профиля кандидата (для обратной совместимости)
router.put('/profile', auth, requireRole(['candidate']), updateProfile);

// Получение резюме кандидата (для обратной совместимости)
router.get('/resume', auth, requireRole(['candidate']), getResume);

// Обновление резюме кандидата (для обратной совместимости)
router.put('/resume', auth, requireRole(['candidate']), updateResume);

module.exports = router;