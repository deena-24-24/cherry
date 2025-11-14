import { create } from 'zustand'
import { InterviewSession, CodeExecutionResult } from '../types'
import { API_URL } from '../config'

interface InterviewState {
  currentSession: InterviewSession | null
  isLoading: boolean
  error: string | null
  isCallActive: boolean
  notes: string
  codeResults: CodeExecutionResult[]

  fetchSession: (sessionId: string) => Promise<void>
  startCall: () => void
  endCall: () => void
  updateNotes: (notes: string) => void
  addCodeResult: (result: CodeExecutionResult) => void
}

export const useInterviewStore = create<InterviewState>((set) => ({
  currentSession: null,
  isLoading: false,
  error: null,
  isCallActive: false,
  notes: '',
  codeResults: [],

  fetchSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`${API_URL}/api/interview/sessions/${sessionId}`, {
        headers: {
          // Если есть авторизация, добавьте токен здесь
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()

      if (data.success) {
        set({
          currentSession: data.session,
          notes: data.session.notes || '',
          isLoading: false
        })
      } else {
        set({ error: data.error, isLoading: false })
      }
    } catch (err) {
      set({ error: 'Failed to load session', isLoading: false })
    }
  },

  startCall: () => set({ isCallActive: true }),
  endCall: () => set({ isCallActive: false }),
  updateNotes: (notes: string) => set({ notes }),
  addCodeResult: (result: CodeExecutionResult) => set(state => ({
    codeResults: [...state.codeResults, result]
  }))
}))