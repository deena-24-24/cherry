import { useState, useCallback, useRef, useEffect } from 'react'
import { socketService } from '../../service/socketService'
import { voiceService } from '../../service/interview/voiceService'
import { AIResponse } from '../../types/interview'

export const useVoiceCall = (sessionId: string) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const handleAIResponse = (data: AIResponse) => {
      console.log('🤖 AI Response:', data.text)
      if (data.text) {
        voiceService.playAudioFromText(data.text)
      }
    }

    socketService.onMessage(handleAIResponse)

    return () => {
      socketService.disconnect()
    }
  }, [])

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const connected = await socketService.connect(sessionId)
      if (!connected) {
        throw new Error('Failed to connect to server')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((arrayBuffer: ArrayBuffer) => {
            socketService.sendAudioChunk(sessionId, arrayBuffer)
          })
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setError(null)

      console.log('🎤 Recording started')
      // Start speech recognition if available (Chrome/Edge)
      const SpeechRecognitionImpl: typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition | undefined = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionImpl) {
        const recognition: SpeechRecognition = new (SpeechRecognitionImpl as any)()
        recognition.lang = 'ru-RU'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const last = event.results.length - 1
          const result = event.results[last]
          const text = result[0]?.transcript?.trim()
          if (text && result.isFinal) {
            socketService.sendTranscript(sessionId, text)
          }
        }
        recognition.onerror = () => {
          // non-fatal
        }
        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Ошибка: ${errorMessage}`)
      console.error('Error starting recording:', err)
    }
  }, [sessionId])

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsRecording(false)
    console.log('⏹️ Recording stopped')
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    error
  }
}