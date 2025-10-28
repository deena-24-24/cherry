import { socketService } from '../socketService'

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
      const response = await fetch(`/api/interview/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })
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