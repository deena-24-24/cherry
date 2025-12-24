const { mockDB } = require('../mockData.js');

/**
 * Получение всех резюме для HR с данными пользователей
 */
const getCandidates = async (req, res) => {
  try {
    // Берем все резюме
    const allResumes = mockDB.resumes;

    // Обогащаем данными пользователя и рейтингом
    const enrichedCandidates = allResumes.map(resume => {
      const user = mockDB.users.find(u => u._id === resume.userId);
      
      // Вычисляем рейтинг (средний балл из интервью)
      const candidateSessions = mockDB.sessions.filter(s => s.candidateId === resume.userId);
      const sessionsWithScore = candidateSessions.filter(s =>
        typeof s.finalReport?.overall_assessment?.final_score === 'number'
      );
      
      let rating = null;
      if (sessionsWithScore.length > 0) {
        const totalScore = sessionsWithScore.reduce((acc, s) =>
          acc + (s.finalReport?.overall_assessment?.final_score ?? 0), 0
        );
        rating = parseFloat((totalScore / sessionsWithScore.length).toFixed(1));
      }
      
      return {
        // Данные резюме имеют приоритет (например, навыки, опыт)
        ...resume,
        resumeId: resume.id, // Явно указываем ID резюме
        // Данные пользователя
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || '',
        email: user?.email || '',
        avatar: user?.avatarUrl || '', // mockDB uses avatarUrl in users
        city: user?.city || '',
        phone: user?.phone || '',
        // Рейтинг из интервью
        rating: rating
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