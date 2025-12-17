const { mockDB } = require('../mockData.js');

/**
 * Получение списка чатов (HR <-> Кандидат)
 */
const getChats = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Фильтруем чаты, где участвует текущий пользователь
    const userConversations = mockDB.hrConversations.filter(c =>
      c.candidateId === userId || c.hrId === userId
    );

    const result = userConversations.map(convo => {
      const isMeCandidate = convo.candidateId === userId;
      const partnerId = isMeCandidate ? convo.hrId : convo.candidateId;
      const partnerUser = mockDB.users.find(u => u._id === partnerId);

      return {
        id: convo.id,
        partnerId: partnerId,
        partnerName: partnerUser
          ? `${partnerUser.firstName} ${partnerUser.lastName}`
          : 'Пользователь',
        partnerCompany: partnerUser?.companyName || (isMeCandidate ? 'Компания' : 'Кандидат'),
        partnerAvatar: partnerUser?.avatarUrl || '',
        lastMessage: convo.lastMessage,
        timestamp: convo.timestamp,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting chats:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

/**
 * Получение деталей чата
 */
const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id || req.user.userId;

    const conversation = mockDB.hrConversations.find(c => c.id === chatId);

    if (!conversation) {
      return res.status(404).json({ message: 'Чат не найден' });
    }

    if (conversation.candidateId !== userId && conversation.hrId !== userId) {
      return res.status(403).json({ message: 'Нет доступа к этому чату' });
    }

    const isMeCandidate = conversation.candidateId === userId;
    const partnerId = isMeCandidate ? conversation.hrId : conversation.candidateId;
    const partnerUser = mockDB.users.find(u => u._id === partnerId);

    res.json({
      id: conversation.id,
      messages: conversation.messages,
      partner: {
        id: partnerId,
        name: partnerUser ? `${partnerUser.firstName} ${partnerUser.lastName}` : 'Пользователь',
        company: partnerUser?.companyName || '',
        avatar: partnerUser?.avatarUrl || ''
      }
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

/**
 * Отправка сообщения
 */
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id || req.user.userId;

    const conversation = mockDB.hrConversations.find(c => c.id === chatId);
    if (!conversation) return res.status(404).json({ message: 'Чат не найден' });

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString().substr(2, 5)}`,
      senderId: userId,
      text,
      timestamp: new Date().toISOString()
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = text;
    conversation.timestamp = newMessage.timestamp;

    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

/**
 * Старт нового чата или получение существующего
 */
const startChat = async (req, res) => {
  try {
    const { targetUserId } = req.body; // ID кандидата (если открывает HR) или HR (если кандидат)
    const currentUserId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    if (!targetUserId) {
      return res.status(400).json({ message: 'Не указан ID собеседника' });
    }

    // Определяем кто есть кто
    let candidateId, hrId;
    if (userRole === 'hr') {
      hrId = currentUserId;
      candidateId = targetUserId;
    } else {
      candidateId = currentUserId;
      hrId = targetUserId;
    }

    // 1. Ищем существующий чат
    let conversation = mockDB.hrConversations.find(c =>
      c.candidateId === candidateId && c.hrId === hrId
    );

    if (conversation) {
      return res.json({ id: conversation.id, isNew: false });
    }

    // 2. Если нет, создаем новый
    const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    conversation = {
      id: newChatId,
      candidateId,
      hrId,
      lastMessage: '',
      timestamp: new Date().toISOString(),
      messages: []
    };

    mockDB.hrConversations.push(conversation);
    console.log(`Создан новый чат ${newChatId} между ${hrId} и ${candidateId}`);

    res.status(201).json({ id: conversation.id, isNew: true });

  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ message: 'Ошибка создания чата' });
  }
};

module.exports = {
  getChats,
  getChatById,
  sendMessage,
  startChat
};