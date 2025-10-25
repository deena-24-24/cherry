// routes/candidateRoutes.js
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/authMiddleware');
const CandidateRoutes = require('../models/Candidate');

// Получение профиля кандидата
router.get('/profile', auth, requireRole(['candidate']), async (req, res) => {
  try {
    const profile = await CandidateRoutes.findOne({ user: req.user._id });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление профиля кандидата
router.put('/profile', auth, requireRole(['candidate']), async (req, res) => {
  try {
    const profile = await CandidateRoutes.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true }
    );

    // Помечаем профиль как завершенный
    if (!req.user.profileCompleted) {
      await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });
    }

    res.json({ message: 'Профиль обновлен', profile });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;