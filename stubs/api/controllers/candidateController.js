const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение всех данных кандидата (профиль + резюме)
 * @route   GET /api/candidate
 * @access  Private
 */
const getCandidate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = mockDB.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Ищем данные кандидата
    let candidate = mockDB.candidates?.find(c => c.userId === userId);
    
    // Проверяем, есть ли файл в резюме
    const resume = mockDB.resumes?.find(r => r.userId === userId);
    
    console.log('🔍 Загрузка данных кандидата:', {
      userId,
      hasCandidate: !!candidate,
      candidateFileName: candidate?.resumeFileName || 'НЕТ',
      hasResume: !!resume,
      resumeFileName: resume?.resumeFileName || 'НЕТ',
      totalCandidates: mockDB.candidates?.length || 0,
      totalResumes: mockDB.resumes?.length || 0
    });
    
    // Если данных кандидата нет, создаем из данных пользователя
    if (!candidate) {
      candidate = {
        userId: userId,
        // Базовые данные из профиля
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        about: user.about || '',
        avatar: user.avatar || '',
        // Данные резюме
        // jobTitle больше не используется, место жительства хранится в country
        experience: [],
        education: [],
        skills: [],
        about: user.about || '', // Информация "О себе"
        resumeFileName: resume?.resumeFileName || '',
        resumeFileData: resume?.resumeFileData || '',
        // Метаданные
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Сохраняем в базу
      if (!mockDB.candidates) {
        mockDB.candidates = [];
      }
      mockDB.candidates.push(candidate);
    } else {
      // Синхронизируем файл из резюме, если он есть там, но отсутствует в кандидате
      if (resume) {
        if (resume.resumeFileName && (!candidate.resumeFileName || !candidate.resumeFileData)) {
          candidate.resumeFileName = resume.resumeFileName;
          candidate.resumeFileData = resume.resumeFileData || '';
          console.log('Файл синхронизирован из резюме в кандидата при загрузке:', resume.resumeFileName);
        } else if (candidate.resumeFileName && (!resume.resumeFileName || !resume.resumeFileData)) {
          // Если файл есть в кандидате, но нет в резюме - синхронизируем обратно
          resume.resumeFileName = candidate.resumeFileName;
          resume.resumeFileData = candidate.resumeFileData || '';
          console.log('Файл синхронизирован в резюме из кандидата при загрузке:', candidate.resumeFileName);
        }
      }
      
      // Обновляем базовые данные из профиля пользователя (если они изменились)
      candidate.firstName = user.firstName || candidate.firstName || '';
      candidate.lastName = user.lastName || candidate.lastName || '';
      candidate.email = user.email || candidate.email || '';
      candidate.phone = user.phone || candidate.phone || '';
      candidate.country = user.country || candidate.country || '';
      candidate.about = user.about || candidate.about || '';
      candidate.avatar = user.avatar || candidate.avatar || '';
    }
    
    // Убеждаемся, что файл включен в ответ и синхронизирован
    // Проверяем файл в резюме, если его нет в кандидате (приоритет резюме)
    if (resume) {
      if (resume.resumeFileName) {
        // Если файл есть в резюме, используем его (даже если есть в кандидате - резюме приоритетнее)
        candidate.resumeFileName = resume.resumeFileName;
        candidate.resumeFileData = resume.resumeFileData || '';
        console.log('✅ Файл найден в резюме и добавлен в ответ:', resume.resumeFileName);
      } else if (candidate.resumeFileName) {
        // Если файл есть только в кандидате, синхронизируем в резюме
        resume.resumeFileName = candidate.resumeFileName;
        resume.resumeFileData = candidate.resumeFileData || '';
        console.log('✅ Файл синхронизирован из кандидата в резюме:', candidate.resumeFileName);
      }
    }
    
    const responseData = {
      ...candidate,
      resumeFileName: candidate.resumeFileName || '',
      resumeFileData: candidate.resumeFileData || ''
    };
    
    console.log('📤 Отправка данных кандидата, файл:', {
      fileName: responseData.resumeFileName || 'НЕТ',
      hasData: !!responseData.resumeFileData,
      dataLength: responseData.resumeFileData?.length || 0
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting candidate:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Обновление всех данных кандидата
 * @route   PUT /api/candidate
 * @access  Private
 */
const updateCandidate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = mockDB.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (!mockDB.candidates) {
      mockDB.candidates = [];
    }
    
    // Ищем существующие данные кандидата
    let candidateIndex = mockDB.candidates.findIndex(c => c.userId === userId);
    
    const updateData = req.body;
    
    console.log('📥 Получены данные для обновления кандидата:', {
      hasResumeFileName: updateData.resumeFileName !== undefined,
      resumeFileName: updateData.resumeFileName || 'НЕТ',
      resumeFileNameType: typeof updateData.resumeFileName,
      hasResumeFileData: updateData.resumeFileData !== undefined,
      resumeFileDataLength: updateData.resumeFileData?.length || 0,
      resumeFileDataType: typeof updateData.resumeFileData,
      updateDataKeys: Object.keys(updateData),
      updateDataString: JSON.stringify(updateData).substring(0, 500) // Первые 500 символов для отладки
    });
    
    // Обновляем данные пользователя (базовый профиль)
    if (updateData.firstName !== undefined) {
      user.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      user.lastName = updateData.lastName;
    }
    if (updateData.email !== undefined) {
      user.email = updateData.email;
    }
    if (updateData.phone !== undefined) {
      user.phone = updateData.phone;
    }
    if (updateData.country !== undefined) {
      user.country = updateData.country;
    }
    if (updateData.about !== undefined) {
      user.about = updateData.about;
    }
    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }
    
    // Подготавливаем данные кандидата
    const candidateData = {
      userId: userId,
      // Базовые данные из профиля
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      country: user.country || '',
      about: user.about || '',
      avatar: user.avatar || '',
      // Данные резюме - обновляем только если они переданы, иначе сохраняем существующие
      // jobTitle больше не используется, место жительства хранится в country
      experience: Array.isArray(updateData.experience) ? updateData.experience : (candidateIndex !== -1 ? mockDB.candidates[candidateIndex].experience : []),
      education: Array.isArray(updateData.education) ? updateData.education : (candidateIndex !== -1 ? mockDB.candidates[candidateIndex].education : []),
      skills: Array.isArray(updateData.skills) ? updateData.skills : (candidateIndex !== -1 ? mockDB.candidates[candidateIndex].skills : []),
      about: updateData.about !== undefined ? updateData.about : (candidateIndex !== -1 ? mockDB.candidates[candidateIndex].about : user.about || ''),
      resumeFileName: updateData.resumeFileName !== undefined ? String(updateData.resumeFileName || '') : (candidateIndex !== -1 ? String(mockDB.candidates[candidateIndex].resumeFileName || '') : ''),
      resumeFileData: updateData.resumeFileData !== undefined ? String(updateData.resumeFileData || '') : (candidateIndex !== -1 ? String(mockDB.candidates[candidateIndex].resumeFileData || '') : ''),
      updatedAt: new Date().toISOString()
    };
    
    // Если данные кандидата существуют, обновляем
    if (candidateIndex !== -1) {
      candidateData.createdAt = mockDB.candidates[candidateIndex].createdAt;
      mockDB.candidates[candidateIndex] = candidateData;
      console.log('✅ Данные кандидата обновлены в mockDB, файл:', {
        fileName: candidateData.resumeFileName || 'НЕТ',
        hasData: !!candidateData.resumeFileData,
        dataLength: candidateData.resumeFileData?.length || 0
      });
    } else {
      // Создаем новые данные кандидата
      candidateData.createdAt = new Date().toISOString();
      mockDB.candidates.push(candidateData);
      console.log('✅ Созданы новые данные кандидата в mockDB, файл:', {
        fileName: candidateData.resumeFileName || 'НЕТ',
        hasData: !!candidateData.resumeFileData,
        dataLength: candidateData.resumeFileData?.length || 0
      });
    }
    
    // Синхронизируем файл с резюме
    if (updateData.resumeFileName !== undefined || updateData.resumeFileData !== undefined) {
      console.log('Синхронизация файла резюме:', {
        fileName: candidateData.resumeFileName,
        hasData: !!candidateData.resumeFileData,
        dataLength: candidateData.resumeFileData?.length || 0
      });
      
      if (!mockDB.resumes) {
        mockDB.resumes = [];
      }
      let resumeIndex = mockDB.resumes.findIndex(r => r.userId === userId);
      if (resumeIndex !== -1) {
        mockDB.resumes[resumeIndex].resumeFileName = candidateData.resumeFileName;
        mockDB.resumes[resumeIndex].resumeFileData = candidateData.resumeFileData;
        console.log('Файл обновлен в резюме');
      } else {
        // Создаем резюме, если его нет
        const newResume = {
          userId: userId,
          fullName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || '',
          email: user.email || '',
          phone: user.phone || '',
          jobTitle: user.country || '',
          photoUrl: user.avatar || '',
          experience: candidateData.experience || [],
          education: candidateData.education || [],
          skills: candidateData.skills || [],
          about: candidateData.about || '',
          resumeFileName: candidateData.resumeFileName,
          resumeFileData: candidateData.resumeFileData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockDB.resumes.push(newResume);
        console.log('Создано новое резюме с файлом');
      }
    }
    
    // Убеждаемся, что файл включен в ответ
    const responseCandidate = {
      ...candidateData,
      resumeFileName: candidateData.resumeFileName || '',
      resumeFileData: candidateData.resumeFileData || ''
    };
    
    console.log('✅ Данные кандидата обновлены, файл:', {
      fileName: responseCandidate.resumeFileName || 'НЕТ',
      hasData: !!responseCandidate.resumeFileData,
      dataLength: responseCandidate.resumeFileData?.length || 0
    });
    
    res.json({ message: 'Данные кандидата обновлены', candidate: responseCandidate });
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

module.exports = {
  getCandidate,
  updateCandidate,
};

