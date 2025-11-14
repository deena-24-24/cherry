import { socketService } from '../socketService'
import { API_URL } from '../../config'

export interface InterviewSessionData {
  id: string
  title: string
  position: string
  difficulty: string
}

export class InterviewService {
  async startInterview(sessionId: string, position: string): Promise<{ success: boolean; sessionId: string }> {
    const connected = await socketService.connect(sessionId)
    return { success: connected, sessionId }
  }

  async saveNotes(sessionId: string, notes: string): Promise<{ success: boolean } | void> {
    try {
      const response = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/notes`, {
        method: 'POST', // Используем POST для обновления
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
    }
  }

  async endInterview(sessionId: string): Promise<{ success: boolean }> {
    socketService.disconnect()
    return { success: true }
  }
}

export const interviewService = new InterviewService()