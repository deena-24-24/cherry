const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение всех данных HR (профиль)
 * @route   GET /api/hr
 * @access  Private
 */
const getHr = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = mockDB.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Ищем данные HR
    let hr = mockDB.hrs?.find(h => h.userId === userId);
    
    console.log('🔍 Загрузка данных HR:', {
      userId,
      hasHr: !!hr,
      totalHrs: mockDB.hrs?.length || 0
    });
    
    // Если данных HR нет, создаем из данных пользователя
    if (!hr) {
      hr = {
        userId: userId,
        // Базовые данные из профиля
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        about: user.about || '',
        avatar: user.avatar || '',
        // HR-специфичные поля
        companyName: user.companyName || '',
        position: user.position || '',
        favoriteCandidateIds: [],
        // Метаданные
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Сохраняем в базу
      if (!mockDB.hrs) {
        mockDB.hrs = [];
      }
      mockDB.hrs.push(hr);
    } else {
      // Обновляем базовые данные из профиля пользователя (если они изменились)
      hr.firstName = user.firstName || hr.firstName || '';
      hr.lastName = user.lastName || hr.lastName || '';
      hr.email = user.email || hr.email || '';
      hr.phone = user.phone || hr.phone || '';
      hr.country = user.country || hr.country || '';
      hr.about = user.about || hr.about || '';
      hr.avatar = user.avatar || hr.avatar || '';
      hr.companyName = user.companyName || hr.companyName || '';
      hr.position = user.position || hr.position || '';
      // Инициализируем favoriteCandidateIds если его нет
      if (!hr.favoriteCandidateIds) {
        hr.favoriteCandidateIds = [];
      }
    }
    
    res.json(hr);
  } catch (error) {
    console.error('Error getting HR:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Обновление всех данных HR
 * @route   PUT /api/hr
 * @access  Private
 */
const updateHr = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = mockDB.users.find(u => u._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (!mockDB.hrs) {
      mockDB.hrs = [];
    }
    
    // Ищем существующие данные HR
    let hrIndex = mockDB.hrs.findIndex(h => h.userId === userId);
    
    const updateData = req.body;
    
    console.log('📥 Получены данные для обновления HR:', {
      updateDataKeys: Object.keys(updateData)
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
    if (updateData.companyName !== undefined) {
      user.companyName = updateData.companyName;
    }
    if (updateData.position !== undefined) {
      user.position = updateData.position;
    }
    
    // Подготавливаем данные HR
    const hrData = {
      userId: userId,
      // Базовые данные из профиля
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      country: user.country || '',
      about: user.about || '',
      avatar: user.avatar || '',
      // HR-специфичные поля
      companyName: user.companyName || '',
      position: user.position || '',
      updatedAt: new Date().toISOString()
    };
    
    // Если данные HR существуют, обновляем
    if (hrIndex !== -1) {
      hrData.createdAt = mockDB.hrs[hrIndex].createdAt;
      mockDB.hrs[hrIndex] = hrData;
      console.log('✅ Данные HR обновлены в mockDB');
    } else {
      // Создаем новые данные HR
      hrData.createdAt = new Date().toISOString();
      mockDB.hrs.push(hrData);
      console.log('✅ Созданы новые данные HR в mockDB');
    }
    
    res.json({ message: 'Данные HR обновлены', hr: hrData });
  } catch (error) {
    console.error('Error updating HR:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

module.exports = {
  getHr,
  updateHr,
};

