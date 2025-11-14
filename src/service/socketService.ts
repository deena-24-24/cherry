import { AIResponse } from '../types'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '../config'

class SocketService {
  private socket: Socket | null = null
  private onMessageCallback: ((data: AIResponse) => void) | null = null

  async connect(sessionId: string): Promise<boolean> {
    try {
      this.socket = io(API_URL, {
        transports: ['websocket'],
        autoConnect: true,
        withCredentials: false
      })

      return new Promise((resolve) => {
        if (!this.socket) return resolve(false)

        this.socket.on('connect', () => {
          console.log('✅ Socket.io connected to interview session')
          this.socket?.emit('join-interview', sessionId)
          resolve(true)
        })

        this.socket.on('ai-audio-response', (payload: { text?: string; audio?: ArrayBuffer; timestamp?: string }) => {
          if (payload?.text && this.onMessageCallback) {
            const aiResponse: AIResponse = {
              text: payload.text,
              timestamp: payload.timestamp || new Date().toISOString()
            }
            this.onMessageCallback(aiResponse)
          }
        })

        this.socket.on('connect_error', (error) => {
          console.error('Socket.io connect error:', error)
          resolve(false)
        })

        this.socket.on('disconnect', () => {
          console.log('Socket.io connection closed')
        })
      })
    } catch (error) {
      console.error('Failed to connect socket.io:', error)
      return false
    }
  }

  onMessage(callback: (data: AIResponse) => void) {
    this.onMessageCallback = callback
  }

  sendAudioChunk(sessionId: string, chunk: ArrayBuffer) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket.io not connected')
      return
    }

    this.socket.emit('audio-chunk', {
      sessionId,
      chunk
    })
    console.log('📤 Sent audio chunk:', chunk.byteLength, 'bytes')
  }

  sendTranscript(sessionId: string, text: string, position: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('Socket.io not connected')
      return
    }
    this.socket.emit('user-transcript', { sessionId, text, position })
    console.log('📤 Sent transcript:', text)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.onMessageCallback = null
  }
}

export const socketService = new SocketService()