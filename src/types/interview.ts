export interface InterviewSession {
  id: string
  title: string
  position: string
  difficulty: 'junior' | 'middle' | 'senior'
  status: 'scheduled' | 'active' | 'completed'
  createdAt: Date
}

export interface AudioState {
  isRecording: boolean
  isPlaying: boolean
  error?: string
}

export interface CodeExecutionResult {
  output: string
  error: string
  executionTime: number
}

export interface AIResponse {
  text: string
  audio?: ArrayBuffer
  timestamp: string
}

export interface SocketMessage {
  type: 'ai-audio-response' | 'audio-chunk' | 'join-interview' | 'error'
  sessionId?: string
  text?: string
  chunkSize?: number
  message?: string
}