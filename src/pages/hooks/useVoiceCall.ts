import { useState, useCallback, useRef, useEffect } from 'react'
import { socketService } from '../../service/socketService'
import { voiceService } from '../../service/interview/voiceService'
import { AIResponse } from '../../types'

export const useVoiceCall = (sessionId: string, position: string) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const handleAIResponse = (data: AIResponse) => {
      if (data.text) {
        setAiResponse(data.text)
        voiceService.playAudioFromText(data.text)
      }
    }

    socketService.connect(sessionId)
    socketService.onMessage(handleAIResponse)

    return () => {
      socketService.disconnect()
    }
  }, [sessionId])

  const startRecording = useCallback(async () => {
    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionImpl) {
      console.error('Speech Recognition API is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'ru-RU'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const text = event.results[last][0].transcript.trim()
      setTranscript(text)

      if (event.results[last].isFinal) {
        // Отправляем финальную расшифровку и позицию
        socketService.sendTranscript(sessionId, text, position)
      }
    }

    // Перезапускаем распознавание после ответа
    recognition.onend = () => {
      if (isRecording) {
        recognition.start()
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
    console.log('🎤 Recording started')
  }, [sessionId, position, isRecording])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    console.log('⏹️ Recording stopped')
  }, [])

  return {
    isRecording,
    startRecording,
    stopRecording,
    transcript,
    aiResponse }
}