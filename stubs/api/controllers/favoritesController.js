const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение избранных кандидатов HR
 * @route   GET /api/hr/favorites
 * @access  Private (HR only)
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;
    const hr = mockDB.hrs?.find(h => h.userId === userId);
    
    if (!hr) {
      return res.json([]);
    }
    
    const favoriteIds = hr.favoriteCandidateIds || [];
    const favorites = favoriteIds.map(id => {
      const candidate = mockDB.candidates?.find(c => c.userId === id);
      if (candidate) {
        const user = mockDB.users.find(u => u._id === id);
        return {
          ...candidate,
          email: user?.email || candidate.email,
          avatar: user?.avatar || candidate.avatar || '',
        };
      }
      return null;
    }).filter(Boolean);
    
    res.json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Добавление кандидата в избранное
 * @route   POST /api/hr/favorites/:candidateId
 * @access  Private (HR only)
 */
const addFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const candidateId = req.params.candidateId;
    
    if (!mockDB.hrs) {
      mockDB.hrs = [];
    }
    
    let hr = mockDB.hrs.find(h => h.userId === userId);
    
    if (!hr) {
      // Создаем HR если его нет
      const user = mockDB.users.find(u => u._id === userId);
      hr = {
        userId: userId,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        country: user?.country || '',
        about: user?.about || '',
        avatar: user?.avatar || '',
        companyName: user?.companyName || '',
        position: user?.position || '',
        favoriteCandidateIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockDB.hrs.push(hr);
    }
    
    if (!hr.favoriteCandidateIds) {
      hr.favoriteCandidateIds = [];
    }
    
    if (!hr.favoriteCandidateIds.includes(candidateId)) {
      hr.favoriteCandidateIds.push(candidateId);
      hr.updatedAt = new Date().toISOString();
    }
    
    res.json({ message: 'Кандидат добавлен в избранное', favoriteIds: hr.favoriteCandidateIds });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Удаление кандидата из избранного
 * @route   DELETE /api/hr/favorites/:candidateId
 * @access  Private (HR only)
 */
const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.userId;
    const candidateId = req.params.candidateId;
    
    const hr = mockDB.hrs?.find(h => h.userId === userId);
    
    if (!hr || !hr.favoriteCandidateIds) {
      return res.json({ message: 'Кандидат не найден в избранном', favoriteIds: [] });
    }
    
    hr.favoriteCandidateIds = hr.favoriteCandidateIds.filter(id => id !== candidateId);
    hr.updatedAt = new Date().toISOString();
    
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

