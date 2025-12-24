const { mockDB } = require('../mockData.js');

/**
 * @desc    Получение профиля пользователя
 * @route   GET /api/candidate/profile или /api/hr/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = mockDB.users.find(u => u._id === userId);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Возвращаем все данные профиля
    const profileData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      city: user.city || '',
      about: user.about || '',
      companyName: user.companyName || '',
      position: user.position || '',
      avatar: user.avatar || user.avatarUrl || '',
      role: user.role
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

/**
 * @desc    Обновление профиля пользователя
 * @route   PUT /api/candidate/profile или /api/hr/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userIndex = mockDB.users.findIndex(u => u._id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const user = mockDB.users[userIndex];
    
    // Обновляем данные профиля
    const updateData = req.body;
    
    // Обновляем только разрешенные поля
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
    if (updateData.city !== undefined) {
      user.city = updateData.city;
    }
    if (updateData.about !== undefined) {
      user.about = updateData.about;
    }
    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
      user.avatarUrl = updateData.avatar; // Синхронизируем оба поля для совместимости
    }
    
    // Для HR также обновляем companyName и position
    if (user.role === 'hr') {
      if (updateData.companyName !== undefined) {
        user.companyName = updateData.companyName;
      }
      if (updateData.position !== undefined) {
        user.position = updateData.position;
      }
    }

    // Сохраняем обновленного пользователя
    mockDB.users[userIndex] = user;

    // Обновляем данные кандидата, если он существует
    if (user.role === 'candidate' && mockDB.candidates) {
      const candidateIndex = mockDB.candidates.findIndex(c => c.userId === user._id);
      if (candidateIndex !== -1) {
        // Обновляем базовые данные кандидата из профиля
        mockDB.candidates[candidateIndex].firstName = user.firstName || '';
        mockDB.candidates[candidateIndex].lastName = user.lastName || '';
        mockDB.candidates[candidateIndex].email = user.email || '';
        mockDB.candidates[candidateIndex].phone = user.phone || '';
        mockDB.candidates[candidateIndex].city = user.city || '';
        mockDB.candidates[candidateIndex].about = user.about || '';
        mockDB.candidates[candidateIndex].avatar = user.avatar || user.avatarUrl || '';
        mockDB.candidates[candidateIndex].updatedAt = new Date().toISOString();
      }
    }
    
    // Обновляем данные HR, если он существует
    if (user.role === 'hr' && mockDB.hrs) {
      const hrIndex = mockDB.hrs.findIndex(h => h.userId === user._id);
      if (hrIndex !== -1) {
        // Обновляем базовые данные HR из профиля
        mockDB.hrs[hrIndex].firstName = user.firstName || '';
        mockDB.hrs[hrIndex].lastName = user.lastName || '';
        mockDB.hrs[hrIndex].email = user.email || '';
        mockDB.hrs[hrIndex].phone = user.phone || '';
        mockDB.hrs[hrIndex].city = user.city || '';
        mockDB.hrs[hrIndex].about = user.about || '';
        mockDB.hrs[hrIndex].avatar = user.avatar || '';
        mockDB.hrs[hrIndex].companyName = user.companyName || '';
        mockDB.hrs[hrIndex].position = user.position || '';
        mockDB.hrs[hrIndex].updatedAt = new Date().toISOString();
      }
    }

    // Возвращаем обновленные данные профиля
    const profileData = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      city: user.city || '',
      about: user.about || '',
      companyName: user.companyName || '',
      position: user.position || '',
      avatar: user.avatar || user.avatarUrl || '',
      role: user.role
    };

    console.log('Профиль обновлен:', profileData);
    res.json({ message: 'Профиль обновлен', profile: profileData });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

