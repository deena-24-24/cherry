import { create } from 'zustand'
import { HrConversation } from '../types'
// Импортируем моковые данные
import { mockDB } from '../../stubs/api/mockData'

interface HrChatStore {
  conversations: HrConversation[];
  getConversationById: (id: string) => HrConversation | undefined;
}

export const useHrChatStore = create<HrChatStore>((set, get) => ({
  // Загружаем разговоры из моковых данных
  conversations: mockDB.hrConversations,

  // Функция для получения конкретного разговора по ID
  getConversationById: (id: string) => {
    const { conversations } = get()
    return conversations.find(c => c.id === id)
  }
}))