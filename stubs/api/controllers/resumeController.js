const { mockDB } = require('../mockData.js');

/**
 * Получение списка резюме текущего пользователя
 */
const getMyResumes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userResumes = mockDB.resumes.filter(r => r.userId === userId);
    res.json(userResumes);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

/**
 * Создание нового резюме
 */
const createResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, position } = req.body;

    const newResume = {
      id: `resume_${Date.now()}`,
      userId,
      title: title || 'Новое резюме',
      position: position || 'Специалист',
      skills: [],
      experience: [],
      education: [],
      about: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockDB.resumes.push(newResume);
    res.status(201).json(newResume);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания резюме' });
  }
};

/**
 * Обновление конкретного резюме по ID
 */
const updateResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params; // ID резюме
    const updateData = req.body;

    const resumeIndex = mockDB.resumes.findIndex(r => r.id === id && r.userId === userId);

    if (resumeIndex === -1) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    mockDB.resumes[resumeIndex] = {
      ...mockDB.resumes[resumeIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    res.json(mockDB.resumes[resumeIndex]);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления' });
  }
};

/**
 * Удаление резюме
 */
const deleteResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const initialLength = mockDB.resumes.length;
    mockDB.resumes = mockDB.resumes.filter(r => !(r.id === id && r.userId === userId));

    if (mockDB.resumes.length === initialLength) {
      return res.status(404).json({ message: 'Резюме не найдено' });
    }

    res.json({ message: 'Резюме удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления' });
  }
};

module.exports = {
  getMyResumes,
  createResume,
  updateResume,
  deleteResume
};