const { getModel } = require('../llm');

/**
 * @desc    Обработка сообщения от пользователя и получение ответа от AI
 * @route   POST /api/chat/message
 * @access  Private
 */
const sendMessageToAI = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Сообщение не может быть пустым' });
  }

  try {
    // Получаем модель GigaChat из llm.js
    const chat = getModel({ provider: 'gigachat' });

    // Системный промпт для настройки поведения AI
    const systemPrompt = "Ты — эксперт по проведению технических собеседований и карьерный коуч. Твоя задача — помогать пользователям готовиться к интервью. Отвечай на их вопросы четко и лаконично. Давай советы по улучшению навыков прохождения собеседований и анализируй их ответы.";

    const fullPrompt = `${systemPrompt}\n\nПользователь: ${message}`;

    // Отправляем промпт в модель
    const aiResponse = await chat.invoke(fullPrompt);

    // Извлекаем текстовый ответ
    const responseText = aiResponse.content || "Извините, я не смог обработать ваш запрос.";

    res.json({ reply: responseText });
  } catch (error) {
    console.error('Ошибка при взаимодействии с GigaChat:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера при обращении к AI' });
  }
};

module.exports = {
  sendMessageToAI,
};