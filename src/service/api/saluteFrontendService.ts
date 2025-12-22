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

      if (!response.ok) throw new Error('TTS Failed')

      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)

      return new Promise((resolve) => {
        this.currentAudio = new Audio(audioUrl)

        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          this.currentAudio = null
          resolve() // Разрешаем промис, чтобы processQueue пошел дальше
        }

        this.currentAudio.onerror = () => {
          console.warn("Audio error")
          resolve() // Даже при ошибке разрешаем, чтобы не зависнуть
        }

        this.currentAudio.play().catch(e => {
          console.warn("Autoplay blocked", e)
          resolve()
        })
      })
    } catch (error) {
      console.error(error)
      return this.playBrowserFallback(text)
    }
  }

  private playBrowserFallback(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ru-RU'
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
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
    if (!token) throw new Error('No token')

    try {
      const response = await fetch(`${API_URL}/api/salute/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${token}`
        },
        body: audioBlob
      })
      if (!response.ok) throw new Error('STT Failed')
      const data = await response.json()
      return data.text || ''
    } catch (error) {
      console.error('Salute STT Error:', error)
      return ''
    }
  }

  isAudioPlaying(): boolean {
    return this.isPlaying
  }
}

export const saluteFrontendService = new SaluteFrontendService()