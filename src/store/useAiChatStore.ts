import { create } from 'zustand'
import { aiChatService } from '../service/api/aiChatService'

interface Message {
  id: string;
  sender: 'user' | 'ai'; // 'ai' здесь означает робота
  text: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (messageText: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  clearMessages: () => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random()}`

export const useAiChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchHistory: async () => {
    set({ isLoading: true })
    try {
      const history = await aiChatService.getHistory()

      if (history && history.length > 0) {
        // Если история есть в БД, используем её
        set({ messages: history, isLoading: false })
      } else {
        // Если истории нет, показываем дефолтное приветствие
        set({
          messages: [{
            id: 'init_welcome',
            sender: 'ai',
            text: 'Здравствуйте! Я ваш ИИ-помощник для подготовки к собеседованиям. Задайте мне любой вопрос.',
          }],
          isLoading: false
        })
      }
    } catch (error) {
      console.error(error)
      set({ isLoading: false })
    }
  },

  sendMessage: async (messageText: string) => {
    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      text: messageText,
    }

    // Сразу добавляем сообщение пользователя
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }))

    try {
      const response = await aiChatService.sendMessage(messageText)

      const aiMessage: Message = {
        id: generateId(),
        sender: 'ai',
        text: response.reply,
      }

      set((state) => ({
        messages: [...state.messages, aiMessage],
        isLoading: false,
      }))
    } catch (error) {
      console.error(error)
      const errorAiMessage: Message = {
        id: generateId(),
        sender: 'ai',
        text: 'Извините, произошла ошибка соединения с сервером.',
      }
      set((state) => ({
        messages: [...state.messages, errorAiMessage],
        isLoading: false,
        error: 'Ошибка отправки',
      }))
    }
  },

  clearMessages: () => set({
    messages: [{
      id: generateId(),
      sender: 'ai',
      text: 'Здравствуйте! Я ваш ИИ-помощник. Чем могу помочь?',
    }]
  })
}))