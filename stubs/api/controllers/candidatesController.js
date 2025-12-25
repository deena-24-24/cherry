const { mockDB } = require('../mockData.js');

/**
 * Получение всех резюме для HR с данными пользователей
 */
const getCandidates = async (req, res) => {
  try {
    // Берем все резюме
    const allResumes = mockDB.resumes;

    const enrichedCandidates = allResumes.map(resume => {
      const user = mockDB.users.find(u => u._id === resume.userId);
      
      // Вычисляем рейтинг (средний балл из интервью)
      const candidateSessions = mockDB.sessions.filter(s => {
        if (s.candidateId !== resume.userId) return false;
        // 2. Проверка на соответствие позиции
        const sessionPos = (s.position || '').toLowerCase().trim();
        const resumePos = (resume.position || '').toLowerCase().trim();
        const resumeTitle = (resume.title || '').toLowerCase().trim();

        // Если в сессии или резюме не указана позиция, пропускаем
        if (!sessionPos) return false;

        // Логика совпадения: содержится ли название позиции сессии в названии резюме или наоборот
        // Например: session="frontend", resume="Frontend Developer" -> true
        return resumePos.includes(sessionPos) ||
          resumeTitle.includes(sessionPos) ||
          sessionPos.includes(resumePos);
      });

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