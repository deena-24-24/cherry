// src/pages/hooks/useVoiceCall.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { socketService } from '../../service/socketService'
import { voiceService } from '../../service/interview/voiceService'
import { AIResponse } from '../../types'

export const useVoiceCall = (sessionId: string, position: string) => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recognitionRestartAttemptsRef = useRef(0) // Счетчик попыток перезапуска

  const fullCleanup = useCallback(() => {
    console.log('🧹 Performing full cleanup of voice call...')

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Recognition already stopped')
      }
      recognitionRef.current = null
    }

    voiceService.stopAudio().catch(console.error)
    socketService.disconnect()

    setIsRecording(false)
    setIsAIThinking(false)
    setIsAISpeaking(false)
    setTranscript('')
    setAiResponse('')
    setError(null)
    recognitionRestartAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    const handleAIResponse = async (data: AIResponse) => {
      console.log('🤖 AI Response received:', data.text)
      if (data.text) {
        setAiResponse(data.text)
        setIsAIThinking(false)
        setError(null)

        setIsAISpeaking(true)
        try {
          console.log('🎵 Playing AI audio...')
          await voiceService.playAssistantResponse(data.text)
          console.log('✅ AI finished speaking')

          // УВЕЛИЧИВАЕМ ЗАДЕРЖКУ ПЕРЕД ЗАПУСКОМ ЗАПИСИ
          setTimeout(() => {
            if (!isRecording) {
              console.log('🎤 Starting recording after AI response')
              startRecording()
            }
          }, 1000) // Было 500, стало 1500 мс
        } catch (error) {
          console.error('❌ Error playing AI audio:', error)
          setTimeout(() => {
            if (!isRecording) {
              startRecording()
            }
          }, 2000)
        } finally {
          setIsAISpeaking(false)
        }
      }
    }

    const handleAIError = (errorMsg: string) => {
      console.error('AI Error in useVoiceCall:', errorMsg)
      setError(errorMsg)
      setIsAIThinking(false)
      setIsAISpeaking(false)

      setTimeout(() => {
        if (!isRecording) {
          startRecording()
        }
      }, 2000)
    }

    console.log(`🎯 Initializing voice call: session=${sessionId}, position=${position}`)

    socketService.connect(sessionId, position)
    socketService.onMessage(handleAIResponse)
    socketService.onError(handleAIError)

    // УВЕЛИЧИВАЕМ НАЧАЛЬНУЮ ЗАДЕРЖКУ
    const timer = setTimeout(() => {
      console.log('🎤 Starting initial recording...')
      startRecording()
    }, 2000) // Было 1000, стало 2000 мс

    return () => {
      console.log('🔴 useVoiceCall unmounting - cleaning up...')
      clearTimeout(timer)
      socketService.offMessage()
      socketService.offError()
      fullCleanup()
    }
  }, [sessionId, position, fullCleanup])

  const startRecording = useCallback(async () => {
    if (isRecording) {
      console.log('Recording already started')
      return
    }

    if (isAISpeaking || isAIThinking) {
      console.log('⏳ Cannot start recording - AI is speaking or thinking')
      return
    }

    const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionImpl) {
      console.error('Speech Recognition API is not supported in this browser.')
      return
    }

    // Останавливаем предыдущее распознавание
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'ru-RU'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started, waiting for speech...')
    }

    // ДОБАВЛЯЕМ: Увеличиваем время ожидания речи
    if (recognition.continuous === undefined) {
      // Для некоторых браузеров устанавливаем таймауты
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started, waiting for speech...')
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const text = event.results[last][0].transcript.trim()
      setTranscript(text)

      if (event.results[last].isFinal) {
        console.log('🎯 Final transcript:', text)
        setIsAIThinking(true)
        recognitionRestartAttemptsRef.current = 0 // Сбрасываем счетчик при успешном распознавании

        const success = socketService.sendTranscript(sessionId, text, position)
        if (success) {
          stopRecording()
        } else {
          console.error('Failed to send transcript, keeping recording active')
          setIsAIThinking(false)
        }
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)

      if (event.error === 'no-speech') {
        console.log('No speech detected - increasing restart delay')
        recognitionRestartAttemptsRef.current++

        // УВЕЛИЧИВАЕМ ЗАДЕРЖКУ ПЕРЕД ПЕРЕЗАПУСКОМ ПРИ no-speech
        const delay = Math.min(1000 * recognitionRestartAttemptsRef.current, 5000)
        console.log(`🔄 Restarting recognition in ${delay}ms (attempt ${recognitionRestartAttemptsRef.current})`)

        setTimeout(() => {
          if (isRecording && !isAIThinking && !isAISpeaking) {
            try {
              recognition.start()
            } catch (error) {
              console.error('Error restarting recognition:', error)
            }
          }
        }, delay)
        return
      }

      if (event.error === 'aborted') {
        console.log('Recognition aborted - normal when stopping')
        return
      }

      setIsRecording(false)
    }

    recognition.onend = () => {
      console.log('Recognition ended')

      // УВЕЛИЧИВАЕМ БАЗОВУЮ ЗАДЕРЖКУ ПЕРЕЗАПУСКА
      if (isRecording && !isAIThinking && !isAISpeaking) {
        const baseDelay = 2000 // Было 500, стало 2000 мс
        const attemptDelay = Math.min(baseDelay * (recognitionRestartAttemptsRef.current + 1), 10000)

        console.log(`🔄 Restarting recognition in ${attemptDelay}ms`)
        setTimeout(() => {
          if (isRecording && !isAIThinking && !isAISpeaking) {
            try {
              recognition.start()
            } catch (error) {
              console.error('Error restarting recognition:', error)
            }
          }
        }, attemptDelay)
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
      recognitionRestartAttemptsRef.current = 0 // Сбрасываем счетчик при успешном запуске
      console.log('🎤 Recording started - waiting for user speech...')
    } catch (error) {
      console.error('Error starting recognition:', error)
    }
  }, [sessionId, position, isRecording, isAIThinking, isAISpeaking])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log('Error stopping recognition:', error)
      }
      recognitionRef.current = null
    }
    setIsRecording(false)
    console.log('⏹️ Recording stopped')
  }, [])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return {
    isRecording,
    isAIThinking,
    isAISpeaking,
    startRecording,
    stopRecording,
    toggleRecording,
    transcript,
    aiResponse,
    error
  }
}