// frontend/services/InterviewService.ts
import { socketService } from '../socketService'
import { voiceService } from './voiceService'
import { AIResponse, InterviewSession, CodeExecutionResult } from '../../types/interview'

export interface ConversationMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export class InterviewService {
  private currentSessionId: string | null = null
  private isConnected: boolean = false
  private aiMessageCallbacks: ((data: AIResponse) => void)[] = []

  async startInterview(sessionId: string, position: string): Promise<{
    success: boolean;
    sessionId: string;
  }> {
    try {
      this.currentSessionId = sessionId

      // Подключаем WebSocket с position
      const connected = await socketService.connect(sessionId, position)
      this.isConnected = connected

      if (!connected) {
        throw new Error('Failed to connect to interview session')
      }

      // Настраиваем обработчик ответов от AI
      socketService.onMessage((data: AIResponse) => {
        this.handleAIResponse(data)
      })

      return {
        success: true,
        sessionId
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      return {
        success: false,
        sessionId
      }
    }
  }

  // Обработчик ответов от AI
  private handleAIResponse(data: AIResponse) {
    console.log('📨 AI Response received:', data.text)

    // Уведомляем всех подписчиков
    this.aiMessageCallbacks.forEach(callback => {
      callback(data)
    })

    // Автоматически проигрываем голосовой ответ, если есть текст
    if (data.text) {
      voiceService.playAudioFromText(data.text).catch(error => {
        console.error('Error playing audio:', error)
      })
    }
  }

  // Отправка транскрипта пользователя
  async sendTranscript(text: string, position: string = 'frontend'): Promise<void> {
    if (!this.isConnected || !this.currentSessionId) {
      throw new Error('Socket not connected or no active session')
    }

    socketService.sendTranscript(this.currentSessionId, text, position)
    console.log('📤 Sent transcript:', text)
  }

  // Отправка аудио чанков
  async sendAudioChunk(chunk: ArrayBuffer): Promise<void> {
    if (!this.isConnected || !this.currentSessionId) {
      throw new Error('Socket not connected or no active session')
    }

    socketService.sendAudioChunk(this.currentSessionId, chunk)
  }

  // Подписка на сообщения от AI (множественные подписчики)
  onAIMessage(callback: (data: AIResponse) => void): void {
    this.aiMessageCallbacks.push(callback)
  }

  // Отписка от сообщений
  offAIMessage(callback: (data: AIResponse) => void): void {
    this.aiMessageCallbacks = this.aiMessageCallbacks.filter(cb => cb !== callback)
  }

  // Сохранение заметок
  async saveNotes(notes: string): Promise<{ success: boolean }> {
    if (!this.currentSessionId) {
      return { success: false }
    }

    try {
      const response = await fetch(`http://localhost:5000/api/interview/sessions/${this.currentSessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      return await response.json()
    } catch (error) {
      console.error('Error saving notes:', error)
      return { success: false }
    }
  }

  // HTTP fallback для отправки сообщений (если сокеты не работают)
  async sendMessageHTTP(message: string, position: string = 'frontend'): Promise<{
    success: boolean;
    assistantResponse: string;
    conversation: ConversationMessage[]
  }> {
    if (!this.currentSessionId) {
      throw new Error('No active session')
    }

    try {
      const response = await fetch(`http://localhost:5000/api/interview/sessions/${this.currentSessionId}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, position })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Error sending message via HTTP:', error)
      throw error
    }
  }

  // Получение истории диалога
  async getConversationHistory(): Promise<ConversationMessage[]> {
    if (!this.currentSessionId) {
      return []
    }

    try {
      const response = await fetch(`http://localhost:5000/api/interview/sessions/${this.currentSessionId}/conversation`)

      if (!response.ok) {
        throw new Error('Failed to fetch conversation history')
      }

      const data = await response.json()
      return data.conversation || []
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }
  }

  // Завершение интервью
  async endInterview(): Promise<{ success: boolean }> {
    try {
      // Отключаем WebSocket
      socketService.disconnect()
      this.isConnected = false

      // Останавливаем голос
      await voiceService.stopAudio()

      // Отмечаем сессию как завершенную
      if (this.currentSessionId) {
        const response = await fetch(`http://localhost:5000/api/interview/sessions/${this.currentSessionId}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          console.warn('Failed to mark session as completed on server')
        }
      }

      // Очищаем состояние
      this.currentSessionId = null
      this.aiMessageCallbacks = []

      return { success: true }
    } catch (error) {
      console.error('Error ending interview:', error)
      return { success: false }
    }
  }

  // Дополнительные полезные методы
  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  isInterviewActive(): boolean {
    return this.isConnected && this.currentSessionId !== null
  }

  isSocketConnected(): boolean {
    return this.isConnected
  }

  // Получение состояния голоса
  isAudioPlaying(): boolean {
    return voiceService.isAudioPlaying()
  }

  // Остановка аудио
  async stopAudio(): Promise<void> {
    await voiceService.stopAudio()
  }

  // Очистка
  cleanup(): void {
    this.offAllAIMessages()
    socketService.disconnect()
    this.currentSessionId = null
    this.isConnected = false
  }

  // Отписка от всех сообщений
  private offAllAIMessages(): void {
    this.aiMessageCallbacks = []
    socketService.offMessage()
  }
}

export const interviewService = new InterviewService()