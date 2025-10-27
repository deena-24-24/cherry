import axios from 'axios'
import { useAuthStore } from '../../store'

// Создаем экземпляр axios с базовым URL
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api/',
})

// Перехватчик запросов для добавления токена авторизации
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})


class ChatService {
  /**
   * Отправляет сообщение на бэкенд и получает ответ от AI.
   * @param message - Текст сообщения пользователя.
   * @returns Объект с ответом AI.
   */
  sendMessage = async (message: string): Promise<{ reply: string }> => {
    try {
      const response = await apiClient.post('/chat/message', { message })
      return response.data
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error)
      throw error
    }
  }
}

const chatService = new ChatService()
export default chatService