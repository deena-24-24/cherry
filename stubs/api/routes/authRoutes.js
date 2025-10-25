// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  registerCandidate,
  registerHr,
  login,
  getMe
} = require('../controllers/authController');
const { auth: authRoutes } = require('../middleware/authMiddleware');

// Публичные маршруты
router.post('/register/candidate', registerCandidate);
router.post('/register/hr', registerHr);
router.post('/login', login);

// Защищенные маршруты
router.get('/me', authRoutes, getMe);

module.exports = router;