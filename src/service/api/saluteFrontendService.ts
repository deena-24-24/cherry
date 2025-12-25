import { API_URL } from '../../config'
import { useAuthStore } from '../../store'

export class SaluteFrontendService {
  private isPlaying = false
  private audioQueue: string[] = []
  private currentAudio: HTMLAudioElement | null = null

  // Коллбэк, который вызывается, когда всё аудио доиграло
  private onPlaybackEnded: (() => void) | null = null

  // Метод для регистрации слушателя
  setAudioEndListener(callback: () => void) {
    this.onPlaybackEnded = callback
  }

  async playAudioFromText(text: string): Promise<void> {
    if (!text.trim()) return

    this.audioQueue.push(text)

    // Если прямо сейчас не играем, запускаем обработку очереди
    if (!this.isPlaying) {
      this.processQueue()
    }
  }

  private async processQueue() {
    // Если очередь пуста - мы закончили
    if (this.audioQueue.length === 0) {
      this.isPlaying = false
      // Сообщаем подписчикам, что аудио закончилось
      if (this.onPlaybackEnded) {
        this.onPlaybackEnded()
      }
      return
    }

    this.isPlaying = true
    const textToPlay = this.audioQueue.shift()

    if (!textToPlay) {
      this.processQueue()
      return
    }

    try {
      await this.synthesizeAndPlay(textToPlay)
    } catch (e) {
      console.error("Playback failed, skipping chunk", e)
    } finally {
      // Рекурсивно вызываем для следующего куска
      this.processQueue()
    }
  }

  private async synthesizeAndPlay(text: string): Promise<void> {
    const { token } = useAuthStore.getState()

    if (!token) return this.playBrowserFallback(text)

    try {
      const response = await fetch(`${API_URL}/api/salute/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        // Для 401 (ошибка аутентификации) это нормально - используем fallback
        // Для других ошибок тоже используем fallback, но логируем
        if (response.status === 401) {
          // Не логируем как ошибку - это ожидаемое поведение при отсутствии правильного токена
          return this.playBrowserFallback(text)
        }
        
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn(`⚠️ Salute TTS failed (${response.status}), using browser fallback:`, errorText.substring(0, 100))
        return this.playBrowserFallback(text)
      }

      const blob = await response.blob()
      if (blob.size === 0) {
        console.warn('⚠️ Salute returned empty audio, using browser fallback')
        return this.playBrowserFallback(text)
      }

      const audioUrl = URL.createObjectURL(blob)

      return new Promise((resolve) => {
        this.currentAudio = new Audio(audioUrl)

        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          resolve() // Разрешаем промис, чтобы processQueue пошел дальше
        }

        this.currentAudio.onerror = (e) => {
          console.warn("⚠️ Audio playback error, falling back to browser TTS", e)
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          this.playBrowserFallback(text).then(() => resolve())
        }

        this.currentAudio.play().catch(e => {
          console.warn("⚠️ Autoplay blocked, falling back to browser TTS", e)
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          this.playBrowserFallback(text).then(() => resolve())
        })
      })
    } catch (error) {
      console.warn('⚠️ Salute TTS error, using browser fallback:', error instanceof Error ? error.message : 'Unknown error')
      return this.playBrowserFallback(text)
    }
  }

  private playBrowserFallback(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('⚠️ Browser TTS not available')
        resolve()
        return
      }
      
      // Останавливаем предыдущее воспроизведение, если есть
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ru-RU'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onend = () => {
        // Вызываем callback завершения воспроизведения, если очередь пуста
        if (this.onPlaybackEnded && this.audioQueue.length === 0) {
          setTimeout(() => {
            if (this.audioQueue.length === 0 && !this.isPlaying) {
              this.onPlaybackEnded()
            }
          }, 100)
        }
        resolve()
      }
      
      utterance.onerror = (e) => {
        console.warn('⚠️ Browser TTS error:', e)
        // Даже при ошибке вызываем callback, если очередь пуста
        if (this.onPlaybackEnded && this.audioQueue.length === 0) {
          setTimeout(() => {
            if (this.audioQueue.length === 0 && !this.isPlaying) {
              this.onPlaybackEnded()
            }
          }, 100)
        }
        resolve()
      }
      
      try {
        window.speechSynthesis.speak(utterance)
      } catch (e) {
        console.warn('⚠️ Failed to start browser TTS:', e)
        resolve()
      }
    })
  }

  stopAudio(): void {
    this.audioQueue = [] // Очищаем очередь
    this.isPlaying = false

    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    // Если остановили принудительно, тоже сообщаем о завершении
    if (this.onPlaybackEnded) {
      this.onPlaybackEnded()
    }
  }

  async recognizeAudio(audioBlob: Blob): Promise<string> {
    const { token } = useAuthStore.getState()
    if (!token) {
      console.warn('⚠️ No auth token for STT, returning empty string')
      return ''
    }

    try {
      const response = await fetch(`${API_URL}/api/salute/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${token}`
        },
        body: audioBlob
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.warn(`⚠️ Salute STT failed (${response.status}):`, errorText.substring(0, 100))
        return '' // Возвращаем пустую строку вместо ошибки
      }
      
      const data = await response.json()
      return data.text || ''
    } catch (error) {
      console.warn('⚠️ Salute STT error:', error instanceof Error ? error.message : 'Unknown error')
      return '' // Возвращаем пустую строку, чтобы не прерывать поток
    }
  }

  isAudioPlaying(): boolean {
    return this.isPlaying
  }
}

export const saluteFrontendService = new SaluteFrontendService()