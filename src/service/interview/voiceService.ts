export class VoiceService {
  private isPlaying = false

  async playAudioFromText(text: string): Promise<void> {
    if (this.isPlaying) {
      await this.stopAudio()
    }

    return new Promise((resolve) => {
      this.isPlaying = true

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ru-RU'
      utterance.rate = 0.9
      utterance.pitch = 1

      utterance.onend = () => {
        this.isPlaying = false
        resolve()
      }

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('Speech synthesis error:', event)
        this.isPlaying = false
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }

  async stopAudio(): Promise<void> {
    this.isPlaying = false
    speechSynthesis.cancel()
  }

  isAudioPlaying(): boolean {
    return this.isPlaying
  }
}

export const voiceService = new VoiceService()