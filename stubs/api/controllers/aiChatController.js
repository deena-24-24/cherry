const chatAgentService = require('../service/chatAgentService');
const { mockDB } = require('../mockData');

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * @desc    Обработка сообщения от пользователя и получение ответа от AI Агента
 * @route   POST /api/ai_chat/message
 * @access  Private
 */
const sendMessageToAI = async (req, res) => {
  const { message } = req.body;

  // Безопасное получение ID пользователя
  // 1. Проверяем req.user на наличие полей id, _id или userId
  // 2. Если нет user, проверяем заголовок сессии
  // 3. Если ничего нет, используем 'guest_session'
  let userId = 'guest_session';

  if (req.user) {
    userId = req.user.id || req.user._id || req.user.userId || userId;
  } else if (req.headers['x-session-id']) {
    userId = req.headers['x-session-id'];
  }
  const sessionKey = String(userId);

  if (!message) {
    return res.status(400).json({ message: 'Сообщение не может быть пустым' });
  }

  try {
    // 1. Сохраняем сообщение ПОЛЬЗОВАТЕЛЯ в БД
    const userMsgObj = {
      id: generateId(),
      userId: sessionKey,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };
    mockDB.aiChats.push(userMsgObj);

    // 2. Получаем ответ от АГЕНТА
    const responseText = await chatAgentService.processMessage(sessionKey, message);

    // 3. Сохраняем сообщение ИИ в БД
    const aiMsgObj = {
      id: generateId(),
      userId: sessionKey,
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString()
    };
    mockDB.aiChats.push(aiMsgObj);

    // Возвращаем ответ фронтенду
    res.json({ reply: responseText, messageId: aiMsgObj.id });
  } catch (error) {
    console.error('CRITICAL ERROR in AI Controller:', error);
    res.status(500).json({
      message: 'Внутренняя ошибка сервера при обращении к AI',
      reply: 'Извините, сейчас я не могу ответить. Попробуйте позже.'
    });
  }
};

const getHistory = async (req, res) => {
  try {
    let userId = 'guest_session';
    if (req.user) {
      userId = req.user.id || req.user._id || req.user.userId || userId;
    } else if (req.headers['x-session-id']) {
      userId = req.headers['x-session-id'];
    }
    const sessionKey = String(userId);

    // Фильтруем сообщения из mockDB для этого пользователя
    const history = mockDB.aiChats.filter(msg => msg.userId === sessionKey);

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Ошибка получения истории' });
  }
};

module.exports = {
  sendMessageToAI,
  getHistory
};