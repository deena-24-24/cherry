import { create } from 'zustand'
import chatService from '../service/chat/chatService'
import { Message } from '../types'

const generateId = () => `msg_${Date.now()}_${Math.random()}`

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (messageText: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: generateId(),
      sender: 'ai',
      text: 'Здравствуйте! Я ваш ИИ-помощник для подготовки к собеседованиям. Задайте мне любой вопрос, связанный с вашей карьерой, техническими темами или поведением на интервью.',
    }
  ],
  isLoading: false,
  error: null,

  sendMessage: async (messageText: string) => {
    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      text: messageText,
    }
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }))

    try {
      const response = await chatService.sendMessage(messageText)
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
      const errorMessage = 'Произошла ошибка при отправке сообщения. Попробуйте еще раз.'
      const errorAiMessage: Message = {
        id: generateId(),
        sender: 'ai',
        text: errorMessage,
      }
      set((state) => ({
        messages: [...state.messages, errorAiMessage],
        isLoading: false,
        error: errorMessage,
      }))
    }
  },
}))