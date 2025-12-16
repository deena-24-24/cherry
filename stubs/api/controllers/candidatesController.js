const { mockDB } = require('../mockData.js');

/**
 * Получение всех резюме для HR с данными пользователей
 */
const getCandidates = async (req, res) => {
  try {
    // Берем все резюме
    const allResumes = mockDB.resumes;

    // Обогащаем данными пользователя
    const enrichedCandidates = allResumes.map(resume => {
      const user = mockDB.users.find(u => u._id === resume.userId);
      return {
        // Данные резюме имеют приоритет (например, навыки, опыт)
        ...resume,
        resumeId: resume.id, // Явно указываем ID резюме
        // Данные пользователя
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || '',
        email: user?.email || '',
        avatar: user?.avatarUrl || '', // mockDB uses avatarUrl in users
        country: user?.country || '',
        phone: user?.phone || ''
      };
    });

    res.json(enrichedCandidates);
  } catch (error) {
    console.error('Error getting candidates:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

module.exports = {
  getCandidates,
};