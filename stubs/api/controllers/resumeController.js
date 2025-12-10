const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение резюме пользователя
 * @route   GET /api/candidate/resume
 * @access  Private
 */
const getResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Ищем резюме пользователя
    let resume = mockDB.resumes?.find(r => r.userId === userId);
    
    // Если резюме нет, создаем базовое из данных профиля
    if (!resume) {
      const user = mockDB.users.find(u => u._id === userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      
      // Проверяем, есть ли данные кандидата с файлом
      const candidate = mockDB.candidates?.find(c => c.userId === userId);
      
      // Создаем базовое резюме из данных профиля
      resume = {
        userId: userId,
        fullName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.country || '', // Используем country как место жительства
        photoUrl: user.avatar || '',
        experience: [],
        education: [],
        skills: [],
        about: user.about || '',
        resumeFileName: candidate?.resumeFileName || '',
        resumeFileData: candidate?.resumeFileData || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Сохраняем в базу
      if (!mockDB.resumes) {
        mockDB.resumes = [];
      }
      mockDB.resumes.push(resume);
    }
    
    res.json(resume);
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Обновление резюме пользователя
 * @route   PUT /api/candidate/resume
 * @access  Private
 */
const updateResume = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = mockDB.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (!mockDB.resumes) {
      mockDB.resumes = [];
    }
    
    // Ищем существующее резюме
    let resumeIndex = mockDB.resumes.findIndex(r => r.userId === userId);
    
    const updateData = req.body;
    
    // Ищем существующие данные кандидата для синхронизации файла
    const candidate = mockDB.candidates?.find(c => c.userId === userId);
    
    // Базовые данные ВСЕГДА берем из профиля, резюме хранит только специфичные данные
    const resumeData = {
      userId: userId,
      // Базовые данные всегда из профиля
      fullName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email || '',
      email: user.email || '',
      phone: user.phone || '',
      // Специфичные данные резюме
      jobTitle: updateData.jobTitle || '', // Место жительства
      photoUrl: user.avatar || '', // Фото тоже из профиля
      experience: updateData.experience || [],
      education: updateData.education || [],
      skills: updateData.skills || [],
      about: updateData.about || user.about || '',
      // Файл резюме - обновляем если передан, иначе берем из существующего резюме или кандидата
      resumeFileName: updateData.resumeFileName !== undefined 
        ? updateData.resumeFileName 
        : (resumeIndex !== -1 ? mockDB.resumes[resumeIndex].resumeFileName : (candidate?.resumeFileName || '')),
      resumeFileData: updateData.resumeFileData !== undefined 
        ? updateData.resumeFileData 
        : (resumeIndex !== -1 ? mockDB.resumes[resumeIndex].resumeFileData : (candidate?.resumeFileData || '')),
      updatedAt: new Date().toISOString()
    };
    
    // Синхронизируем файл с данными кандидата
    if (updateData.resumeFileName !== undefined || updateData.resumeFileData !== undefined) {
      if (!mockDB.candidates) {
        mockDB.candidates = [];
      }
      let candidateIndex = mockDB.candidates.findIndex(c => c.userId === userId);
      if (candidateIndex !== -1) {
        mockDB.candidates[candidateIndex].resumeFileName = resumeData.resumeFileName;
        mockDB.candidates[candidateIndex].resumeFileData = resumeData.resumeFileData;
      } else {
        // Создаем запись кандидата, если её нет
        const newCandidate = {
          userId: userId,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          country: user.country || '',
          about: user.about || '',
          avatar: user.avatar || '',
          experience: [],
          education: [],
          skills: [],
          resumeFileName: resumeData.resumeFileName,
          resumeFileData: resumeData.resumeFileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockDB.candidates.push(newCandidate);
      }
    }
    
    // Если резюме существует, обновляем
    if (resumeIndex !== -1) {
      resumeData.createdAt = mockDB.resumes[resumeIndex].createdAt;
      mockDB.resumes[resumeIndex] = resumeData;
    } else {
      // Создаем новое резюме
      resumeData.createdAt = new Date().toISOString();
      mockDB.resumes.push(resumeData);
    }
    
    console.log('Резюме обновлено:', resumeData);
    res.json({ message: 'Резюме обновлено', resume: resumeData });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

module.exports = {
  getResume,
  updateResume,
};

