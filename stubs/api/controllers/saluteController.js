const saluteService = require('../service/saluteService');

const synthesize = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const audioBuffer = await saluteService.synthesize(text);

    res.set({
      'Content-Type': 'audio/ogg; codecs=opus',
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (error) {
    // Если ошибка аутентификации или scope, возвращаем 401 - это не критическая ошибка
    // Фронтенд должен использовать браузерный fallback
    if (error.message.includes('Failed to auth') || error.message.includes('scope')) {
      console.warn('⚠️ Salute TTS authentication failed, client should use browser fallback:', error.message);
      return res.status(401).json({ 
        message: 'TTS Authentication Error',
        details: 'Salute API authentication failed. Using browser TTS fallback.',
        fallback: true
      });
    }
    
    console.error('❌ Controller TTS Error:', error.message);
    res.status(500).json({ 
      message: 'TTS Error',
      details: error.message 
    });
  }
};

const recognize = async (req, res) => {
  try {
    const audioData = req.body;

    // Логируем размер входящих данных
    console.log(`📥 Controller received audio data size: ${audioData ? audioData.length : 0} bytes`);

    if (!audioData || audioData.length === 0) {
      console.error('❌ Audio data is empty in controller');
      return res.status(400).json({ message: 'Audio data is required' });
    }

    // Если это Buffer (Node.js), все ок. Если это пустой объект {}, значит парсер не сработал.
    if (!Buffer.isBuffer(audioData) && Object.keys(audioData).length === 0) {
      console.error('❌ Body parser failed (received empty object)');
      return res.status(400).json({ message: 'Invalid content type or empty body' });
    }

    const text = await saluteService.recognize(audioData);
    res.json({ text });
  } catch (error) {
    console.error('Controller STT Error:', error.message);
    // Передаем статус ошибки от сервиса, если есть
    const status = error.response?.status || 500;
    res.status(status).json({ message: 'STT Error', details: error.message });
  }
};

module.exports = {
  synthesize,
  recognize
};