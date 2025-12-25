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

  fetchSession: (sessionId: string, options?: { signal?: AbortSignal }) => Promise<void>
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

  fetchSession: async (sessionId: string, options?: { signal?: AbortSignal }) => {
    const signal = options?.signal

    set({ isLoading: true, error: null })

    try {
      const response = await fetch(
        `${API_URL}/api/interview/sessions/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          signal // передаем AbortSignal в fetch
        }
      )

      // Проверяем, был ли запрос отменен
      if (signal?.aborted) {
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Проверяем еще раз на отмену после получения данных
      if (signal?.aborted) {
        return
      }

      if (data.success) {
        set({
          currentSession: data.session,
          notes: data.session.notes || '',
          isLoading: false
        })
      } else {
        set({ error: data.error || 'Unknown error', isLoading: false })
      }
    } catch (err) {
      // Игнорируем ошибки отмены запроса
      if (err.name === 'AbortError') {
        return
      }

      console.error('Ошибка при загрузке сессии:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load session',
        isLoading: false
      })
    }
  },

  startCall: () => set({ isCallActive: true }),
  endCall: () => set({ isCallActive: false }),
  updateNotes: (notes: string) => set({ notes }),
  addCodeResult: (result: CodeExecutionResult) => set(state => ({
    codeResults: [...state.codeResults, result]
  }))
}))