const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение списка всех кандидатов
 * @route   GET /api/hr/candidates
 * @access  Private (HR only)
 */
const getCandidates = async (req, res) => {
  try {
    // Получаем всех кандидатов из базы
    const candidates = mockDB.candidates || [];
    
    // Обогащаем данные информацией из users
    const enrichedCandidates = candidates.map(candidate => {
      const user = mockDB.users.find(u => u._id === candidate.userId);
      return {
        ...candidate,
        email: user?.email || candidate.email,
        avatar: user?.avatar || candidate.avatar || '',
      };
    });
    
    res.json(enrichedCandidates);
  } catch (error) {
    console.error('Error getting candidates:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

module.exports = {
  getCandidates,
};

