const { mockDB } = require('../mockData.js');

/**
 * Получение списка чатов (HR <-> Кандидат)
 */
const getChats = async (req, res) => {
  try {
    // В authMiddleware мы должны были записать user в req.user
    // Обычно req.user = { id: '...', role: '...' }
    const userId = req.user.id || req.user.userId;

    // Фильтруем чаты, где участвует текущий пользователь
    const userConversations = mockDB.hrConversations.filter(c =>
      c.candidateId === userId || c.hrId === userId
    );

    const result = userConversations.map(convo => {
      // Определяем ID собеседника
      const isMeCandidate = convo.candidateId === userId;
      const partnerId = isMeCandidate ? convo.hrId : convo.candidateId;

      // Ищем инфо о партнере (в реальной БД это join)
      // В mockData у нас есть массивы candidates и hrs или users.
      // Допустим, ищем в users для универсальности
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

    // Проверка доступа
    if (conversation.candidateId !== userId && conversation.hrId !== userId) {
      return res.status(403).json({ message: 'Нет доступа к этому чату' });
    }

    // Данные партнера
    const isMeCandidate = conversation.candidateId === userId;
    const partnerId = isMeCandidate ? conversation.hrId : conversation.candidateId;
    const partnerUser = mockDB.users.find(u => u._id === partnerId);

    res.json({
      id: conversation.id,
      messages: conversation.messages, // [{ id, senderId, text, timestamp }]
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
 * Отправка сообщения (Human)
 */
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id || req.user.userId;

    const conversation = mockDB.hrConversations.find(c => c.id === chatId);
    if (!conversation) return res.status(404).json({ message: 'Чат не найден' });

    // Проверка прав
    if (conversation.candidateId !== userId && conversation.hrId !== userId) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

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
 * Старт нового чата
 */
const startChat = async (req, res) => {
  // Реализация создания чата
  res.status(200).json({ message: "Функционал создания чата" })
};

module.exports = {
  getChats,
  getChatById,
  sendMessage,
  startChat
};
