import axios from 'axios'
import { useAuthStore } from '../../store'
import { API_URL } from '../../config'

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
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

// Типы для HR-чата (Human-to-Human)
export interface ChatPreview {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCompany: string;
  partnerAvatar: string;
  lastMessage: string;
  timestamp: string;
}

export interface ChatMessageData {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface FullChat {
  id: string;
  messages: ChatMessageData[];
  partner: {
    id: string;
    name: string;
    company: string;
    avatar: string;
  };
}

export const chatService = {
  getChats: async (): Promise<ChatPreview[]> => {
    const response = await apiClient.get('/chat/chats')
    return response.data
  },

  getChatById: async (chatId: string): Promise<FullChat> => {
    const response = await apiClient.get(`/chat/chats/${chatId}`)
    return response.data
  },

  sendMessage: async (chatId: string, text: string): Promise<ChatMessageData> => {
    const response = await apiClient.post(`/chat/chats/${chatId}/message`, { text })
    return response.data
  },

  startChat: async (targetUserId: string): Promise<{ id: string; isNew: boolean }> => {
    const response = await apiClient.post('/chat/start', { targetUserId })
    return response.data
  }
}
