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
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null) // Ref для актуальной функции startRecording
  const positionRef = useRef(position) // Ref для позиции, чтобы избежать переинициализации

  const fullCleanup = useCallback(() => {
    console.log('🧹 Performing full cleanup of voice call...')

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log(`Recognition already stopped: ${e}`)
      }
      recognitionRef.current = null
    }

    voiceService.stopAudio().catch(console.error)
    //socketService.disconnect()

    setIsRecording(false)
    setIsAIThinking(false)
    setIsAISpeaking(false)
    setTranscript('')
    setAiResponse('')
    setError(null)
    recognitionRestartAttemptsRef.current = 0
  }, [])

  useEffect(() => {
    // НЕ инициализируем, если позиция еще не загружена
    if (!position || !sessionId) {
      console.log(`⏳ Waiting for position to load: session=${sessionId}, position=${position}`)
      return
    }

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
            if (!isRecording && startRecordingRef.current) {
              console.log('🎤 Starting recording after AI response')
              startRecordingRef.current()
            }
          }, 800) // Было 500, стало 1500 мс
        } catch (error) {
          console.error('❌ Error playing AI audio:', error)
          setTimeout(() => {
            if (!isRecording && startRecordingRef.current) {
              startRecordingRef.current()
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
        if (!isRecording && startRecordingRef.current) {
          startRecordingRef.current().then()
        }
      }, 2000)
    }

    console.log(`🎯 Initializing voice call: session=${sessionId}, position=${position}`)

    // Обновляем ref для позиции
    positionRef.current = position

    socketService.connect(sessionId, position).then()
    socketService.onMessage(handleAIResponse)
    socketService.onError(handleAIError)

    // УВЕЛИЧИВАЕМ НАЧАЛЬНУЮ ЗАДЕРЖКУ
    const timer = setTimeout(() => {
      console.log('🎤 Starting initial recording...')
      if (startRecordingRef.current) {
        startRecordingRef.current().then()
      }
    }, 2000)

    return () => {
      console.log('🔴 useVoiceCall unmounting - cleaning up...')
      clearTimeout(timer)
      socketService.offMessage()
      socketService.offError()
      fullCleanup()
    }
  }, [sessionId, position, fullCleanup]) // Добавили position обратно в зависимости

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
    console.warn('⏹️ Recording stopped')
  }, [])

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
      setError('Speech Recognition API не поддерживается в этом браузере')
      return
    }

    console.log('✅ Speech Recognition API available')

    // Останавливаем предыдущее распознавание
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    // SpeechRecognition сам запрашивает доступ к микрофону
    // НЕ нужно вызывать getUserMedia - это создает конфликт!
    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'ru-RU'
    recognition.continuous = false  // Как в старом рабочем коде
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started, waiting for speech...')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1
      const text = event.results[last][0].transcript.trim()
      setTranscript(text)

      if (event.results[last].isFinal) {
        console.log('🎯 Final transcript:', text)
        setIsAIThinking(true)
        recognitionRestartAttemptsRef.current = 0 // Сбрасываем счетчик при успешном распознавании

        // Используем актуальную позицию из ref
        const success = socketService.sendTranscript(sessionId, text, positionRef.current)
        if (success) {
          stopRecording()
        } else {
          console.error('Failed to send transcript, keeping recording active')
          setIsAIThinking(false)
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error, event)

      // Ошибки доступа к микрофону
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.error('🚫 Microphone access denied in Speech Recognition')
        setError('Доступ к микрофону запрещен. Пожалуйста, разрешите доступ к микрофону в настройках браузера.')
        setIsRecording(false)
        return
      }

      // Ошибки отсутствия микрофона
      if (event.error === 'no-speech') {
        console.log('🔇 No speech detected - increasing restart delay')
        recognitionRestartAttemptsRef.current++

        // УВЕЛИЧИВАЕМ ЗАДЕРЖКУ ПЕРЕД ПЕРЕЗАПУСКОМ ПРИ no-speech
        const delay = Math.min(1000 * recognitionRestartAttemptsRef.current, 5000)
        console.log(`🔄 Restarting recognition in ${delay}ms (attempt ${recognitionRestartAttemptsRef.current})`)

        setTimeout(() => {
          if (isRecording && !isAIThinking && !isAISpeaking) {
            try {
              // Используем recognition напрямую из замыкания, как в старом коде
              recognition.start()
            } catch (error) {
              console.error('Error restarting recognition:', error)
            }
          }
        }, delay)
        return
      }

      // Ошибка сети - перезапускаем
      if (event.error === 'network') {
        console.warn('🌐 Network error in speech recognition - will retry')
        recognitionRestartAttemptsRef.current++
        
        const delay = Math.min(2000 * recognitionRestartAttemptsRef.current, 10000)
        console.log(`🔄 Retrying recognition after network error in ${delay}ms (attempt ${recognitionRestartAttemptsRef.current})`)
        
        setTimeout(() => {
          if (isRecording && !isAIThinking && !isAISpeaking) {
            try {
              // Используем recognition напрямую из замыкания, как в старом коде
              recognition.start()
              console.log('🔄 Recognition restarted after network error')
            } catch (error) {
              console.error('❌ Error restarting recognition after network error:', error)
            }
          }
        }, delay)
        return
      }

      // Нормальная остановка
      if (event.error === 'aborted') {
        console.log('⏹️ Recognition aborted - normal when stopping')
        return
      }

      // Другие ошибки
      console.error('❌ Unhandled recognition error:', event.error)
      setError(`Ошибка распознавания речи: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      console.log('Recognition ended')

      // УВЕЛИЧИВАЕМ БАЗОВУЮ ЗАДЕРЖКУ ПЕРЕЗАПУСКА
      // ВАЖНО: используем recognition напрямую из замыкания, как в старом рабочем коде
      if (isRecording && !isAIThinking && !isAISpeaking) {
        const baseDelay = 2000 // Было 500, стало 2000 мс
        const attemptDelay = Math.min(baseDelay * (recognitionRestartAttemptsRef.current + 1), 10000)

        console.log(`🔄 Restarting recognition in ${attemptDelay}ms`)
        setTimeout(() => {
          if (isRecording && !isAIThinking && !isAISpeaking) {
            try {
              // Используем recognition напрямую из замыкания, как в старом коде
              recognition.start()
              console.log('🎤 Recognition restarted successfully')
            } catch (error) {
              console.error('Error restarting recognition:', error)
            }
          }
        }, attemptDelay)
      } else {
        // Если не перезапускаем, сбрасываем флаг записи
        setIsRecording(false)
      }
    }

    try {
      console.log('🚀 Attempting to start speech recognition...')
      console.log('🔍 Recognition object:', {
        lang: recognition.lang,
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        serviceURI: (recognition as any).serviceURI || 'default'
      })
      
      // Проверяем, что мы на HTTPS или localhost (требование SpeechRecognition)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      if (!isSecure) {
        console.warn('⚠️ SpeechRecognition requires HTTPS or localhost. Current protocol:', window.location.protocol)
        setError('SpeechRecognition требует HTTPS соединение или localhost')
      }
      
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
      recognitionRestartAttemptsRef.current = 0 // Сбрасываем счетчик при успешном запуске
      console.log('🎤 Recording started - waiting for user speech...')
      setError(null) // Очищаем ошибки при успешном запуске
    } catch (error) {
      console.error('❌ Error starting recognition:', error)
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      setError(`Ошибка запуска распознавания: ${error.message || 'Неизвестная ошибка'}`)
    }
  }, [sessionId, position, isRecording, isAIThinking, isAISpeaking, stopRecording])

  // Обновляем ref при изменении функции
  useEffect(() => {
    startRecordingRef.current = startRecording
  }, [startRecording])

  // Обновляем positionRef при изменении позиции
  useEffect(() => {
    positionRef.current = position
  }, [position])

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording().then()
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