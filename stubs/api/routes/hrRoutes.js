// routes/hrRoutes.js
const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/authMiddleware');
const HrRoutes = require('../models/HR');

// Получение профиля HR
router.get('/profile', auth, requireRole(['hr']), async (req, res) => {
  try {
    const profile = await HrRoutes.findOne({ user: req.user._id });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// Обновление профиля HR
router.put('/profile', auth, requireRole(['hr']), async (req, res) => {
  try {
    const profile = await HrRoutes.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true }
    );

    if (!req.user.profileCompleted) {
      await User.findByIdAndUpdate(req.user._id, { profileCompleted: true });
    }

    res.json({ message: 'Профиль обновлен', profile });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;