// src/service/interview/interviewService.ts
import { socketService } from '../realtime/socketService'
import { API_URL } from '../../config'
import {
  AIResponse,
  SocketInterviewCompleted,
  InterviewSession
} from '../../types'

export interface ConversationMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

export class InterviewService {
  private currentSessionId: string | null = null
  private isConnected: boolean = false
  private aiMessageCallbacks: ((data: AIResponse) => void)[] = []
  private interviewCompletedCallbacks: ((data: SocketInterviewCompleted) => void)[] = []

  // Получение списка сессий пользователя
  async fetchUserSessions(userId: string): Promise<InterviewSession[]> {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authorization token found')

      const response = await fetch(`${API_URL}/api/interview/users/${userId}/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to fetch user sessions')
      const data = await response.json()
      return data.sessions || []
    } catch (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }
  }

  async startInterview(sessionId: string, position: string): Promise<{
    success: boolean;
    sessionId: string;
  }> {
    try {
      this.currentSessionId = sessionId
      const connected = await socketService.connect(sessionId, position)
      this.isConnected = connected

      if (!connected) throw new Error('Failed to connect to interview session')

      socketService.onMessage((data: AIResponse) => {
        this.handleAIResponse(data)
      })

      socketService.onInterviewCompleted((data: SocketInterviewCompleted) => {
        this.handleInterviewCompleted(data)
      })

      return { success: true, sessionId }
    } catch (error) {
      console.error('Error starting interview:', error)
      return { success: false, sessionId }
    }
  }

  private handleAIResponse(data: AIResponse) {
    console.log('📨 AI Response received:', data.text)
    this.aiMessageCallbacks.forEach(callback => callback(data))
  }

  private handleInterviewCompleted(data: SocketInterviewCompleted) {
    console.log('🏁 Interview completed event received:', data)
    this.interviewCompletedCallbacks.forEach(callback => callback(data))
  }

  async sendTranscript(text: string, position: string = 'frontend'): Promise<void> {
    if (!this.isConnected || !this.currentSessionId) throw new Error('Socket not connected')
    const success = socketService.sendTranscript(this.currentSessionId, text, position)
    if (!success) throw new Error('Failed to send transcript')
    console.log('📤 Sent transcript:', text)
  }

  async sendAudioChunk(chunk: ArrayBuffer): Promise<void> {
    if (!this.isConnected || !this.currentSessionId) throw new Error('Socket not connected')
    const success = socketService.sendAudioChunk(this.currentSessionId, chunk)
    if (!success) throw new Error('Failed to send audio chunk')
  }

  onAIMessage(callback: (data: AIResponse) => void): void {
    this.aiMessageCallbacks.push(callback)
  }

  onInterviewCompleted(callback: (data: SocketInterviewCompleted) => void): void {
    this.interviewCompletedCallbacks.push(callback)
  }

  offAIMessage(callback: (data: AIResponse) => void): void {
    this.aiMessageCallbacks = this.aiMessageCallbacks.filter(cb => cb !== callback)
  }

  offInterviewCompleted(callback: (data: SocketInterviewCompleted) => void): void {
    this.interviewCompletedCallbacks = this.interviewCompletedCallbacks.filter(cb => cb !== callback)
  }

  async completeInterview(): Promise<{ success: boolean }> {
    if (!this.currentSessionId) return { success: false }
    try {
      const success = socketService.sendCompleteInterview(this.currentSessionId)
      if (!success) throw new Error('Failed to send complete-interview')
      console.log('✅ Complete interview request sent')
      return { success: true }
    } catch (error) {
      console.error('Error completing interview:', error)
      return { success: false }
    }
  }

  async saveNotes(notes: string): Promise<{ success: boolean }> {
    if (!this.currentSessionId) return { success: false }
    try {
      const response = await fetch(`${API_URL}/api/interview/sessions/${this.currentSessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes }),
      })
      if (!response.ok) throw new Error('Failed to save notes')
      return await response.json()
    } catch (error) {
      console.error('Error saving notes:', error)
      return { success: false }
    }
  }

  async sendMessageHTTP(message: string, position: string = 'frontend'): Promise<{
    success: boolean;
    assistantResponse: string;
    conversation: ConversationMessage[]
  }> {
    if (!this.currentSessionId) throw new Error('No active session')
    try {
      const response = await fetch(`${API_URL}/api/interview/sessions/${this.currentSessionId}/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, position })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return response.json()
    } catch (error) {
      console.error('Error sending message via HTTP:', error)
      throw error
    }
  }

  async getConversationHistory(): Promise<ConversationMessage[]> {
    if (!this.currentSessionId) return []
    try {
      const response = await fetch(`${API_URL}/api/interview/sessions/${this.currentSessionId}/conversation`)
      if (!response.ok) throw new Error('Failed to fetch conversation history')
      const data = await response.json()
      return data.conversation || []
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      return []
    }
  }

  async endInterview(): Promise<{ success: boolean }> {
    try {
      socketService.disconnect()
      this.isConnected = false
      if (this.currentSessionId) {
        const response = await fetch(`${API_URL}/api/interview/sessions/${this.currentSessionId}/complete`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        if (!response.ok) console.warn('Failed to mark session as completed on server')
      }
      this.currentSessionId = null
      this.aiMessageCallbacks = []
      this.interviewCompletedCallbacks = []
      return { success: true }
    } catch (error) {
      console.error('Error ending interview:', error)
      return { success: false }
    }
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId
  }

  isInterviewActive(): boolean {
    return this.isConnected && this.currentSessionId !== null
  }

  isSocketConnected(): boolean {
    return this.isConnected
  }

  async stopAudio(): Promise<void> {
    // Placeholder to satisfy interface if called externally
  }

  cleanup(): void {
    this.offAllAIMessages()
    this.offAllInterviewCompleted()
    socketService.disconnect()
    this.currentSessionId = null
    this.isConnected = false
  }

  private offAllAIMessages(): void {
    this.aiMessageCallbacks = []
    socketService.offMessage()
  }

  private offAllInterviewCompleted(): void {
    this.interviewCompletedCallbacks = []
    socketService.offInterviewCompleted()
  }
}

export const interviewService = new InterviewService()