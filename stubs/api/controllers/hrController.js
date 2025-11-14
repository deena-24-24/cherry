const { mockDB } = require('../mockData');

class HrController {
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