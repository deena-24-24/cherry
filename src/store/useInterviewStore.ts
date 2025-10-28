import { create } from 'zustand'
import { InterviewSession } from '../types/interview'

interface InterviewState {
  currentSession: InterviewSession | null
  isCallActive: boolean
  isAudioProcessing: boolean
  notes: string
  codeResults: string[]

  joinSession: (session: InterviewSession) => void
  startCall: () => void
  endCall: () => void
  updateNotes: (notes: string) => void
  addCodeResult: (result: string) => void
  setAudioProcessing: (processing: boolean) => void
}

export const useInterviewStore = create<InterviewState>((set, get) => ({
  currentSession: null,
  isCallActive: false,
  isAudioProcessing: false,
  notes: '',
  codeResults: [],

  joinSession: (session: InterviewSession) => {
    set({ currentSession: session })
  },

  startCall: () => {
    set({ isCallActive: true })
  },

  endCall: () => {
    set({
      isCallActive: false,
      isAudioProcessing: false
    })
  },

  updateNotes: (notes: string) => {
    set({ notes })
  },

  addCodeResult: (result: string) => {
    set(state => ({
      codeResults: [...state.codeResults, result]
    }))
  },

  setAudioProcessing: (processing: boolean) => {
    set({ isAudioProcessing: processing })
  },
}))