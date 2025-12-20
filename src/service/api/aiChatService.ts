import axios from 'axios'
import { useAuthStore } from '../../store'
import { API_URL } from '../../config'

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const aiChatService = {
  /**
   * Отправляет сообщение ИИ-агенту.
   */
  sendMessage: async (message: string): Promise<{ reply: string }> => {
    try {
      const response = await apiClient.post('/ai_chat/message', { message })
      return response.data
    } catch (error) {
      console.error("Ошибка при отправке сообщения AI:", error)
      throw error
    }
  },
  /**
   * Получает историю чата
   */
  getHistory: async (): Promise<[]> => {
    try {
      const response = await apiClient.get('/ai_chat/history')
      return response.data
    } catch (err) {
      console.error("Ошибка при получении истории AI:", err)
      return []
    }
  }
}