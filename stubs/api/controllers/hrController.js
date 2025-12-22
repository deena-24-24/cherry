const { mockDB } = require('../mockData');

class HrController {
  /**
   * @desc    Получение всех данных HR (профиль)
   * @route   GET /api/hr
   * @access  Private
   */
  async getHr(req, res) {
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
          city: user.city || '',
          about: user.about || '',
          avatar: user.avatar || '',
          // HR-специфичные поля
          companyName: user.companyName || '',
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
        hr.city = user.city || hr.city || '';
        hr.about = user.about || hr.about || '';
        hr.avatar = user.avatar || hr.avatar || '';
        hr.companyName = user.companyName || hr.companyName || '';
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
  async updateHr(req, res) {
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
      if (updateData.city !== undefined) {
        user.city = updateData.city;
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


      // Подготавливаем данные HR
      const hrData = {
        userId: userId,
        // Базовые данные из профиля
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        about: user.about || '',
        avatar: user.avatar || '',
        // HR-специфичные поля
        companyName: user.companyName || '',
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
  }

  /**
   * @desc    Получение списка HR-чатов для текущего пользователя (кандидата)
   * @route   GET /api/hr/chats
   * @access  Private
   */
  async getConversations(req, res) {
    try {
      const currentUserId = req.user.userId;

      const userConversations = mockDB.hrConversations.filter(c => c.candidateId === currentUserId);

      const enrichedConversations = userConversations.map(convo => {
        const hr = mockDB.users.find(u => u._id === convo.hrId);
        return {
          id: convo.id,
          partnerName: `${hr?.firstName} ${hr?.lastName}`,
          partnerCompany: hr?.companyName || 'Неизвестная компания',
          lastMessage: convo.lastMessage,
          timestamp: convo.timestamp,
          avatarUrl: hr?.avatarUrl || '',
        };
      });

      res.json(enrichedConversations);
    } catch (error) {
      console.error('Ошибка при получении HR-чатов:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  }

  /**
   * @desc    Получение полной истории сообщений для одного чата
   * @route   GET /api/hr/chats/:chatId
   * @access  Private
   */
  async getConversationById(req, res) {
    try {
      const { chatId } = req.params;
      const currentUserId = req.user.userId;

      const conversation = mockDB.hrConversations.find(c => c.id === chatId);

      if (!conversation) {
        return res.status(404).json({ message: 'Чат не найден' });
      }

      if (conversation.candidateId !== currentUserId) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }

      const hr = mockDB.users.find(u => u._id === conversation.hrId);
      const conversationWithHrInfo = {
        ...conversation,
        hrInfo: {
          name: `${hr.firstName} ${hr.lastName}`,
          company: hr.companyName,
          avatarUrl: hr.avatarUrl
        }
      }

      res.json(conversationWithHrInfo);
    } catch (error) {
      console.error('Ошибка при получении сообщений чата:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  }

  /**
   * @desc    Отправка сообщения в HR-чат
   * @route   POST /api/hr/chats/:chatId/message
   * @access  Private
   */
  async sendMessage(req, res) {
    try {
      const { chatId } = req.params;
      const { text } = req.body;
      const currentUserId = req.user.userId;
      const currentUserRole = req.user.role; // 'candidate' или 'hr'

      if (!text) {
        return res.status(400).json({ message: 'Текст сообщения не может быть пустым' });
      }

      const conversation = mockDB.hrConversations.find(c => c.id === chatId);
      if (!conversation) {
        return res.status(404).json({ message: 'Чат не найден' });
      }

      if (conversation.candidateId !== currentUserId && conversation.hrId !== currentUserId) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }

      const newMessage = {
        id: `msg_${Date.now()}`,
        sender: currentUserRole === 'candidate' ? 'user' : 'hr',
        text,
      };

      conversation.messages.push(newMessage);
      conversation.lastMessage = text;
      conversation.timestamp = 'Сейчас';

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
  }
}

module.exports = new HrController();

