const axios = require('axios');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

class SaluteService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  async getToken() {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      // ПРИОРИТЕТ: SALUTE_AUTH > REACT_APP_SALUTE_SPEECH_API_KEY > GIGA_AUTH
      // REACT_APP_SALUTE_SPEECH_API_KEY доступен только на фронтенде, но если он есть в .env на бэкенде,
      // то можно использовать его напрямую (без префикса REACT_APP_)
      const authKey = process.env.SALUTE_AUTH || 
                     process.env.SALUTE_SPEECH_API_KEY || 
                     process.env.REACT_APP_SALUTE_SPEECH_API_KEY ||
                     process.env.GIGA_AUTH;
      const scope = process.env.SALUTE_SCOPE || 'SALUTE_SPEECH_PERS';

      if (!authKey) {
        throw new Error('SALUTE_AUTH token is missing in .env');
      }

      const rquid = uuidv4();

      const response = await axios.post(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        `scope=${scope}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${authKey}`,
            'RqUID': rquid,
          },
          httpsAgent
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_at - 60000);

      return this.accessToken;
    } catch (error) {
      const errorData = error.response?.data || error.message;
      console.error('❌ Error getting Salute token:', JSON.stringify(errorData, null, 2));
      throw new Error('Failed to auth with SaluteSpeech');
    }
  }

  async synthesize(text) {
    const token = await this.getToken();
    const rquid = uuidv4();

    try {
      const response = await axios.post(
        'https://smartspeech.sber.ru/rest/v1/text:synthesize',
        text,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/text',
            'RqUID': rquid
          },
          params: {
            format: 'opus',
            voice: 'Pon_24000',
          },
          responseType: 'arraybuffer',
          httpsAgent
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ TTS Error:', error.message);
      throw error;
    }
  }

  async recognize(audioBuffer) {
    const token = await this.getToken();
    const rquid = uuidv4();

    try {
      const response = await axios.post(
        'https://smartspeech.sber.ru/rest/v1/speech:recognize',
        audioBuffer,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'audio/x-pcm;bit=16;rate=16000', // Строго PCM 16/16000
            'RqUID': rquid
          },
          httpsAgent
        }
      );

      // Sber может вернуть 200 OK, но пустой результат, если была тишина
      if (response.data && response.data.result && response.data.result.length > 0) {
        return response.data.result[0];
      }

      console.warn('⚠️ Sber returned success but no text found');
      return '';
    } catch (error) {
      // Подробный вывод ошибки от Сбера
      if (error.response) {
        console.error('❌ STT API Error:', error.response.status, error.response.data);
      } else {
        console.error('❌ STT Network/Code Error:', error.message);
      }
      throw error;
    }
  }
}

module.exports = new SaluteService();