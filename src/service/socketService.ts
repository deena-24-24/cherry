// src/service/socketService.ts
import { AIResponse } from '../types'
import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private onMessageCallback: ((data: AIResponse) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isManualDisconnect = false

  async connect(sessionId: string, position: string = 'frontend'): Promise<boolean> {
    try {
      this.isManualDisconnect = false

      this.socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'], // Добавляем fallback
        autoConnect: true,
        withCredentials: false,
        timeout: 10000,
        forceNew: true
      })

      return new Promise((resolve) => {
        if (!this.socket) {
          console.error('❌ Socket initialization failed')
          resolve(false)
          return
        }

        const connectionTimeout = setTimeout(() => {
          console.error('❌ Socket connection timeout')
          resolve(false)
        }, 10000)

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout)
          console.log('✅ Socket.io connected to interview session')
          this.reconnectAttempts = 0
          this.socket?.emit('join-interview', { sessionId, position })
          resolve(true)
        })

        this.socket.on('ai-response', (payload: { text?: string; audio?: ArrayBuffer; timestamp?: string }) => {
          console.log('📨 Received AI response:', payload?.text?.substring(0, 100))
          if (payload?.text && this.onMessageCallback) {
            const aiResponse: AIResponse = {
              text: payload.text,
              timestamp: payload.timestamp || new Date().toISOString()
            }
            this.onMessageCallback(aiResponse)
          }
        })

        this.socket.on('ai-audio-response', (payload: { text?: string; audio?: ArrayBuffer; timestamp?: string }) => {
          console.log('📨 Received AI audio response')
          if (payload?.text && this.onMessageCallback) {
            const aiResponse: AIResponse = {
              text: payload.text,
              timestamp: payload.timestamp || new Date().toISOString()
            }
            this.onMessageCallback(aiResponse)
          }
        })

        this.socket.on('ai-error', (payload: { message?: string; sessionId?: string }) => {
          console.error('❌ AI Error:', payload?.message)
          if (this.onErrorCallback) {
            this.onErrorCallback(payload?.message || 'Unknown AI error')
          }
        })

        this.socket.on('connect_error', (error) => {
          clearTimeout(connectionTimeout)
          console.error('❌ Socket.io connect error:', error.message)
          this.handleReconnection(sessionId, position)
          resolve(false)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket.io disconnected:', reason)
          if (!this.isManualDisconnect && reason === 'transport close') {
            this.handleReconnection(sessionId, position)
          }
        })

        this.socket.on('reconnect_attempt', (attempt) => {
          console.log(`🔄 Reconnection attempt ${attempt}`)
        })

        this.socket.on('reconnect_failed', () => {
          console.error('❌ All reconnection attempts failed')
          if (this.onErrorCallback) {
            this.onErrorCallback('Connection to server failed')
          }
        })
      })
    } catch (error) {
      console.error('❌ Failed to connect socket.io:', error)
      return false
    }
  }

  private handleReconnection(sessionId: string, position: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isManualDisconnect) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * this.reconnectAttempts, 10000)

      console.log(`🔄 Attempting reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        if (!this.isManualDisconnect) {
          this.connect(sessionId, position)
        }
      }, delay)
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Maximum reconnection attempts reached')
      if (this.onErrorCallback) {
        this.onErrorCallback('Connection lost. Please refresh the page.')
      }
    }
  }

  onMessage(callback: (data: AIResponse) => void) {
    this.onMessageCallback = callback
  }

  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback
  }

  offMessage() {
    this.onMessageCallback = null
  }

  offError() {
    this.onErrorCallback = null
  }

  sendAudioChunk(sessionId: string, chunk: ArrayBuffer) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.io not connected, cannot send audio chunk')
      return false
    }

    try {
      this.socket.emit('audio-chunk', {
        sessionId,
        chunk
      })
      console.log('📤 Sent audio chunk:', chunk.byteLength, 'bytes')
      return true
    } catch (error) {
      console.error('❌ Error sending audio chunk:', error)
      return false
    }
  }

  sendTranscript(sessionId: string, text: string, position: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.io not connected, cannot send transcript')
      return false
    }

    if (!sessionId || !text?.trim()) {
      console.error('❌ Invalid data for sendTranscript:', { sessionId, text, position })
      return false
    }

    try {
      this.socket.emit('user-transcript', {
        sessionId,
        text: text.trim(),
        position
      })
      console.log('📤 Sent transcript:', text.substring(0, 100) + '...')
      return true
    } catch (error) {
      console.error('❌ Error sending transcript:', error)
      return false
    }
  }

  getConnectionState(): string {
    return this.socket?.connected ? 'connected' : 'disconnected'
  }

  disconnect() {
    console.log('🔌 Manually disconnecting socket...')
    this.isManualDisconnect = true
    this.reconnectAttempts = 0

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.onMessageCallback = null
    this.onErrorCallback = null
  }
}

export const socketService = new SocketService()