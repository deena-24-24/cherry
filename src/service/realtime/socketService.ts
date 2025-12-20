import { io, Socket } from 'socket.io-client'
import { API_URL } from '../../config'
import { AIResponse, SocketInterviewCompleted, SocketJoinInterview } from '../../types'

class SocketService {
  private socket: Socket | null = null

  // Callbacks
  private onMessageCallback: ((data: AIResponse) => void) | null = null
  private onStreamChunkCallback: ((text: string) => void) | null = null
  private onStreamStartCallback: (() => void) | null = null
  private onStreamEndCallback: (() => void) | null = null
  private onInterviewCompletedCallback: ((data: SocketInterviewCompleted) => void) | null = null
  // коллбэк для начала завершения
  private onCompletionStartedCallback: (() => void) | null = null

  async connect(sessionId: string, position: string = 'frontend'): Promise<boolean> {
    if (this.socket?.connected) return true

    this.socket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: true
    })

    return new Promise((resolve) => {
      this.socket?.on('connect', () => {
        console.log('✅ Socket connected')
        const joinData: SocketJoinInterview = { sessionId, position }
        this.socket?.emit('join-interview', joinData)
        resolve(true)
      })

      this.socket?.on('ai-audio-response', (data: AIResponse) => {
        if (this.onMessageCallback) this.onMessageCallback(data)
      })

      this.socket?.on('ai-stream-start', () => {
        if (this.onStreamStartCallback) this.onStreamStartCallback()
      })

      this.socket?.on('ai-stream-chunk', (data: { text: string }) => {
        if (this.onStreamChunkCallback) this.onStreamChunkCallback(data.text)
      })

      this.socket?.on('ai-stream-end', () => {
        if (this.onStreamEndCallback) this.onStreamEndCallback()
      })

      // Слушаем событие начала генерации отчета
      this.socket?.on('interview-completion-started', () => {
        if (this.onCompletionStartedCallback) this.onCompletionStartedCallback()
      })

      this.socket?.on('interview-completed', (data: SocketInterviewCompleted) => {
        if (this.onInterviewCompletedCallback) this.onInterviewCompletedCallback(data)
      })
    })
  }

  sendTranscript(sessionId: string, text: string, position: string): boolean {
    if (!this.socket?.connected) return false
    this.socket.emit('user-transcript', { sessionId, text, position })
    return true
  }

  sendUserStartedSpeaking(sessionId: string): void {
    if(this.socket?.connected) {
      this.socket.emit('user-started-speaking', { sessionId })
    }
  }

  // Added missing method
  sendAudioChunk(sessionId: string, chunk: ArrayBuffer): boolean {
    if (!this.socket?.connected) return false
    this.socket.emit('audio-chunk', { sessionId, chunk })
    return true
  }

  sendCompleteInterview(sessionId: string): boolean {
    if (!this.socket?.connected) return false
    this.socket.emit('complete-interview', { sessionId })
    return true
  }

  // Setters for callbacks
  onMessage(cb: (data: AIResponse) => void) { this.onMessageCallback = cb }
  onStreamChunk(cb: (text: string) => void) { this.onStreamChunkCallback = cb }
  onStreamStart(cb: () => void) { this.onStreamStartCallback = cb }
  onStreamEnd(cb: () => void) { this.onStreamEndCallback = cb }
  onInterviewCompleted(cb: (data: SocketInterviewCompleted) => void) { this.onInterviewCompletedCallback = cb }

  onCompletionStarted(cb: () => void) { this.onCompletionStartedCallback = cb }

  // Unsubscribe methods
  offMessage() { this.onMessageCallback = null }
  offStreamChunk() { this.onStreamChunkCallback = null }
  offStreamStart() { this.onStreamStartCallback = null }
  offStreamEnd() { this.onStreamEndCallback = null }
  offInterviewCompleted() { this.onInterviewCompletedCallback = null }

  offCompletionStarted() { this.onCompletionStartedCallback = null }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getConnectionState() {
    return this.socket?.connected ? 'connected' : 'disconnected'
  }
}

export const socketService = new SocketService()