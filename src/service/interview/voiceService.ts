// src/service/interview/voiceService.ts
export class VoiceService {
  private isPlaying = false
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private audioContext: AudioContext | null = null
  private playbackTimeout: NodeJS.Timeout | null = null

  async playAudioFromText(text: string): Promise<void> {
    // Останавливаем предыдущее воспроизведение перед созданием нового
    await this.stopAudio()

    return new Promise((resolve, reject) => {
      // Проверяем поддержку речи
      if (!this.isSpeechSupported()) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      this.isPlaying = true

      // Создаем новый utterance
      this.currentUtterance = new SpeechSynthesisUtterance(text)
      this.currentUtterance.lang = 'ru-RU'
      this.currentUtterance.rate = 0.9
      this.currentUtterance.pitch = 1
      this.currentUtterance.volume = 0.8

      // Очищаем предыдущий таймаут
      if (this.playbackTimeout) {
        clearTimeout(this.playbackTimeout)
        this.playbackTimeout = null
      }

      // Сохраняем ссылку на текущий utterance для проверки в обработчиках
      const currentUtterance = this.currentUtterance

      this.currentUtterance.onend = () => {
        // Проверяем, что это тот же utterance
        if (this.currentUtterance === currentUtterance) {
          console.log('✅ Speech synthesis ended normally')
          this.isPlaying = false
          this.currentUtterance = null
          this.playbackTimeout = null
          resolve()
        }
      }

      this.currentUtterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // Проверяем, что это тот же utterance
        if (this.currentUtterance === currentUtterance) {
          console.error('❌ Speech synthesis error:', event.error, event.type)
          this.isPlaying = false
          this.currentUtterance = null
          this.playbackTimeout = null

          // Игнорируем ошибки 'interrupted', так как они нормальны при остановке
          if (event.error !== 'interrupted') {
            reject(new Error(`Speech synthesis failed: ${event.error}`))
          } else {
            console.log('🔄 Speech synthesis interrupted - normal behavior')
            resolve() // Разрешаем промис при преднамеренной остановке
          }
        }
      }

      // Используем более короткую задержку и проверку
      this.playbackTimeout = setTimeout(() => {
        // Проверяем, что utterance все еще валиден
        if (this.currentUtterance === currentUtterance && this.isPlaying) {
          try {
            speechSynthesis.speak(this.currentUtterance)
            console.log('🎵 Started speech synthesis')
          } catch (error) {
            console.error('❌ Error starting speech synthesis:', error)
            this.isPlaying = false
            this.currentUtterance = null
            this.playbackTimeout = null
            reject(error)
          }
        } else {
          console.log('🔄 Speech synthesis cancelled before start')
          this.isPlaying = false
          resolve()
        }
      }, 100)
    })
  }

  async stopAudio(): Promise<void> {
    // Очищаем таймаут
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout)
      this.playbackTimeout = null
    }

    // Останавливаем синтез речи
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
      console.log('🛑 Speech synthesis cancelled')
    }
    // Сбрасываем состояние
    this.isPlaying = false
    this.currentUtterance = null
  }

  isAudioPlaying(): boolean {
    return this.isPlaying && speechSynthesis.speaking
  }

  async playAssistantResponse(response: string): Promise<void> {
    await this.stopAudio()
    return this.playAudioFromText(response)
  }

  isSpeechSupported(): boolean {
    return 'speechSynthesis' in window
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices().filter(voice =>
      voice.lang.includes('ru') || voice.lang.includes('en')
    )
  }
}

export const voiceService = new VoiceService()