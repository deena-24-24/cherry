const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение избранных кандидатов HR
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const hr = mockDB.hrs?.find(h => h.userId === userId);

    if (!hr || !hr.favoriteCandidateIds) {
      return res.json([]);
    }

    // Возвращаем полные объекты резюме/кандидатов по ID пользователей
    const favorites = [];

    for (const favUserId of hr.favoriteCandidateIds) {
      // Ищем резюме этого кандидата (берем первое попавшееся или основное)
      const resume = mockDB.resumes?.find(r => r.userId === favUserId);
      const user = mockDB.users.find(u => u._id === favUserId);

      if (user) {
        favorites.push({
          resumeId: resume?.id || 'profile_only',
          userId: user._id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          avatar: user.avatarUrl || user.avatar || '',
          country: user.country || '',
          phone: user.phone || '',
          position: resume?.position || 'Кандидат',
          skills: resume?.skills || [],
          experience: resume?.experience || []
        });
      }
    }

    res.json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Добавление кандидата в избранное
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { candidateId } = req.params; // Это userId кандидата

    if (!mockDB.hrs) {
      mockDB.hrs = [];
    }

    let hr = mockDB.hrs.find(h => h.userId === userId);

    if (!hr) {
      // Если HR нет в таблице hrs (например, только зарегистрировался), создаем запись
      const user = mockDB.users.find(u => u._id === userId);
      hr = {
        userId: userId,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        favoriteCandidateIds: [],
        createdAt: new Date().toISOString()
      };
      mockDB.hrs.push(hr);
    }

    if (!hr.favoriteCandidateIds) {
      hr.favoriteCandidateIds = [];
    }

    if (!hr.favoriteCandidateIds.includes(candidateId)) {
      hr.favoriteCandidateIds.push(candidateId);
      console.log(`HR ${userId} добавил в избранное кандидата ${candidateId}`);
    }

    res.json({ message: 'Кандидат добавлен в избранное', favoriteIds: hr.favoriteCandidateIds });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Удаление кандидата из избранного
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { candidateId } = req.params;

    const hr = mockDB.hrs?.find(h => h.userId === userId);

    if (!hr || !hr.favoriteCandidateIds) {
      return res.json({ message: 'Список избранного пуст', favoriteIds: [] });
    }

    hr.favoriteCandidateIds = hr.favoriteCandidateIds.filter(id => id !== candidateId);
    console.log(`HR ${userId} удалил из избранного кандидата ${candidateId}`);

    res.json({ message: 'Кандидат удален из избранного', favoriteIds: hr.favoriteCandidateIds });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};