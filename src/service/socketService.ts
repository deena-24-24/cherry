import {
  AIResponse,
  AIMetadata,
  SocketInterviewCompleted,
  SocketUserTranscript,
  SocketJoinInterview,
  SocketCompleteInterview,
  SocketAudioChunk,
  FinalReport,
  isSocketAIResponseExtended,
  extractAIResponse,
  isSocketAIError
} from '../types'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '../config'

class SocketService {
  private socket: Socket | null = null
  private onMessageCallback: ((data: AIResponse) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private onInterviewCompletedCallback: ((data: SocketInterviewCompleted) => void) | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isManualDisconnect = false
  private pendingInterviewCompletedEvent: SocketInterviewCompleted | null = null

  async connect(sessionId: string, position: string = 'frontend'): Promise<boolean> {
    try {
      this.isManualDisconnect = false

      console.log(`🔗 Connecting to WebSocket: session=${sessionId}, position=${position}`)

      this.socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        withCredentials: false,
        timeout: 20000, // Увеличиваем таймаут до 20 секунд
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
        }, 20000) // Увеличиваем таймаут до 20 секунд

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout)
          console.log('✅ Socket.io connected to interview session')
          this.reconnectAttempts = 0

          const joinData: SocketJoinInterview = { sessionId, position }
          console.log(`📤 Sending join-interview:`, joinData)
          this.socket?.emit('join-interview', joinData)
          resolve(true)
        })

        // Обработчик AI ответов
        this.socket.on('ai-audio-response', (payload: unknown) => {
          console.log('📨 Received AI audio response payload:', payload)

          try {
            // Проверяем что payload правильного формата
            if (!isSocketAIResponseExtended(payload)) {
              console.warn('⚠️ Invalid AI response format')
              //return
            }

            let text = ''
            let metadata: AIMetadata = {}
            let timestamp = new Date().toISOString()

            // Безопасно извлекаем данные
            //const { text, metadata, timestamp } = extractAIResponse(payload)

            if (typeof payload === 'string') {
              text = payload
            } else if (payload && typeof payload === 'object') {
              const p = payload as Record<string, unknown>

              // Извлекаем текст из разных форматов
              if (typeof p.text === 'string') {
                text = p.text
              } else if (p.text && typeof p.text === 'object') {
                // Обрабатываем вложенный text объект
                const textObj = p.text as Record<string, unknown>
                text = String(textObj.text || textObj.content || textObj.message || '')
              } else if (typeof p.response === 'string') {
                text = p.response
              }

              // Извлекаем метаданные
              if (p.metadata && typeof p.metadata === 'object') {
                metadata = p.metadata as AIMetadata
              }

              // Извлекаем timestamp
              if (typeof p.timestamp === 'string') {
                timestamp = p.timestamp
              }
            }


            if (text && this.onMessageCallback) {
              const aiResponse: AIResponse = {
                text: text,
                timestamp: timestamp,
                metadata: metadata
              }
              console.log('🎯 Sending AI response to callback:', text.substring(0, 100))
              this.onMessageCallback(aiResponse)
            } else {
              console.warn('⚠️ Empty AI response received after processing')
            }
          } catch (error) {
            console.error('❌ Error processing AI response:', error)
          }
        })
        // Внутри connect() в socketService.ts

        this.socket.on('interview-completed', (payload: unknown) => {
          console.log('🏁 Interview completed event received:', payload)
          console.log('🔍 Callback status:', {
            hasCallback: !!this.onInterviewCompletedCallback,
            callback: this.onInterviewCompletedCallback ? 'Function' : 'null'
          })

          // Обработка payload...
          let data: SocketInterviewCompleted | null = null

          if (Array.isArray(payload) && payload.length > 0) {
            data = payload[0] as SocketInterviewCompleted
          } else if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            data = payload as SocketInterviewCompleted
          }

          if (data) {
            if (this.onInterviewCompletedCallback) {
              console.log('✅ Calling interview-completed callback immediately')
              try {
                this.onInterviewCompletedCallback(data)
              } catch (error) {
                console.error('❌ Error in callback execution:', error)
              }
            } else {
              console.log('📦 No callback yet, storing event in buffer')
              // Сохраняем событие в буфер, чтобы вызвать позже
              this.pendingInterviewCompletedEvent = data
            }
          } else {
            console.error('❌ Invalid interview-completed payload:', payload)
          }
        })

        // Обработчик ошибок AI
        this.socket.on('ai-error', (payload: unknown) => {
          if (isSocketAIError(payload)) {
            console.error('❌ AI Error:', payload.message)
            if (this.onErrorCallback) {
              this.onErrorCallback(payload.message)
            }
          } else {
            console.warn('⚠️ Invalid AI error payload')
          }
        })

        this.socket.on('connect_error', (error: Error) => {
          clearTimeout(connectionTimeout)
          console.error('❌ Socket.io connect error:', error.message)
          this.handleReconnection(sessionId, position)
          resolve(false)
        })

        this.socket.on('disconnect', (reason: string) => {
          console.log('🔌 Socket.io disconnected:', reason)
          if (!this.isManualDisconnect && reason === 'transport close') {
            this.handleReconnection(sessionId, position)
          }
        })

        this.socket.on('reconnect_attempt', (attempt: number) => {
          console.log(`🔄 Reconnection attempt ${attempt}`)
        })

        this.socket.on('reconnect_failed', () => {
          console.error('❌ All reconnection attempts failed')
          if (this.onErrorCallback) {
            this.onErrorCallback('Connection to server failed')
          }
        })

        // Логируем все события для отладки
        this.socket.onAny((eventName: string, ...args: unknown[]) => {
          if (eventName !== 'ai-audio-response') {
            console.log(`📨 Socket event [${eventName}]:`, args)
          }
        })
      })
    } catch (error) {
      console.error('❌ Failed to connect socket.io:', error)
      return false
    }
  }

  private handleReconnection(sessionId: string, position: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isManualDisconnect) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * this.reconnectAttempts, 10000)

      console.log(`🔄 Attempting reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        if (!this.isManualDisconnect) {
          this.connect(sessionId, position).catch((error) => {
            console.error('❌ Reconnection failed:', error)
          })
        }
      }, delay)
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Maximum reconnection attempts reached')
      if (this.onErrorCallback) {
        this.onErrorCallback('Connection lost. Please refresh the page.')
      }
    }
  }

  getCallbackStatus(): boolean {
    return !!this.onInterviewCompletedCallback
  }


  // Подписка на обычные AI сообщения
  onMessage(callback: (data: AIResponse) => void): void {
    this.onMessageCallback = callback
  }

  // Подписка на завершение интервью
  onInterviewCompleted(callback: (data: SocketInterviewCompleted) => void): void {
    console.log('📝 Setting interview-completed callback')
    this.onInterviewCompletedCallback = callback
    console.log('✅ Interview-completed callback set:', !!this.onInterviewCompletedCallback)

    // Если есть событие в буфере, вызываем его немедленно
    if (this.pendingInterviewCompletedEvent) {
      console.log('📦 Processing pending interview-completed event from buffer')
      try {
        callback(this.pendingInterviewCompletedEvent)
      } catch (error) {
        console.error('❌ Error processing pending event:', error)
      }
      this.pendingInterviewCompletedEvent = null
    }
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback
  }

  offMessage(): void {
    this.onMessageCallback = null
  }

  offInterviewCompleted(): void {
    this.onInterviewCompletedCallback = null
  }

  offError(): void {
    this.onErrorCallback = null
  }

  sendAudioChunk(sessionId: string, chunk: ArrayBuffer): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.io not connected, cannot send audio chunk')
      return false
    }

    try {
      const audioData: SocketAudioChunk = { sessionId, chunk }
      this.socket.emit('audio-chunk', audioData)
      console.log('📤 Sent audio chunk:', chunk.byteLength, 'bytes')
      return true
    } catch (error) {
      console.error('❌ Error sending audio chunk:', error)
      return false
    }
  }

  sendTranscript(sessionId: string, text: string, position: string): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.io not connected, cannot send transcript')
      return false
    }

    if (!sessionId || !text?.trim()) {
      console.error('❌ Invalid data for sendTranscript:', { sessionId, text, position })
      return false
    }

    try {
      const transcriptData: SocketUserTranscript = {
        sessionId,
        text: text.trim(),
        position
      }
      this.socket.emit('user-transcript', transcriptData)
      console.log('📤 Sent transcript:', text.substring(0, 100) + '...')
      return true
    } catch (error) {
      console.error('❌ Error sending transcript:', error)
      return false
    }
  }

  // Метод для ручного завершения интервью
  sendCompleteInterview(sessionId: string): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket.io not connected, cannot complete interview')
      return false
    }

    try {
      const completeData: SocketCompleteInterview = { sessionId }
      this.socket.emit('complete-interview', completeData)
      console.log('📤 Sent complete-interview request')
      return true
    } catch (error) {
      console.error('❌ Error sending complete-interview:', error)
      return false
    }
  }

  getConnectionState(): string {
    return this.socket?.connected ? 'connected' : 'disconnected'
  }

  disconnect(): void {
    console.log('🔌 Manually disconnecting socket...')
    this.isManualDisconnect = true
    this.reconnectAttempts = 0

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }

    this.onMessageCallback = null
    this.onErrorCallback = null
    this.onInterviewCompletedCallback = null
  }
}

export const socketService = new SocketService()