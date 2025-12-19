import { create } from 'zustand'
import { chatService, ChatPreview, FullChat } from '../service/api/chatService'

interface ChatState {
  chats: ChatPreview[];
  activeChat: FullChat | null;
  isLoadingList: boolean;
  isLoadingChat: boolean;
  isSending: boolean;
  error: string | null;

  fetchChats: () => Promise<void>;
  fetchChatById: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  clearActiveChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  isLoadingList: false,
  isLoadingChat: false,
  isSending: false,
  error: null,

  fetchChats: async () => {
    set({ isLoadingList: true, error: null })
    try {
      const chats = await chatService.getChats()
      // Сортировка по времени последнего сообщения
      const sortedChats = chats.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      set({ chats: sortedChats, isLoadingList: false })
    } catch (err) {
      set({ error: err.message || 'Ошибка загрузки чатов', isLoadingList: false })
    }
  },

  fetchChatById: async (chatId: string) => {
    set({ isLoadingChat: true, error: null })
    try {
      const activeChat = await chatService.getChatById(chatId)
      set({ activeChat, isLoadingChat: false })
    } catch (err) {
      set({ error: err.message || 'Ошибка загрузки диалога', isLoadingChat: false })
    }
  },

  sendMessage: async (chatId: string, text: string) => {
    set({ isSending: true })
    try {
      const newMessage = await chatService.sendMessage(chatId, text)

      const { activeChat, chats } = get()

      // 1. Обновляем активный чат (добавляем сообщение в список)
      if (activeChat && activeChat.id === chatId) {
        set({
          activeChat: {
            ...activeChat,
            messages: [...activeChat.messages, newMessage]
          }
        })
      }

      // 2. Обновляем превью чата в боковой панели (текст и время)
      const updatedChats = chats.map(c =>
        c.id === chatId
          ? { ...c, lastMessage: text, timestamp: newMessage.timestamp }
          : c
      )

      // Сортируем заново, чтобы активный чат прыгнул вверх
      updatedChats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      set({ chats: updatedChats, isSending: false })
    } catch (err) {
      set({ error: err.message || 'Не удалось отправить сообщение', isSending: false })
    }
  },

  clearActiveChat: () => set({ activeChat: null })
}))