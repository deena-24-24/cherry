import { useState, useRef, useEffect, useCallback } from 'react'
import { saluteFrontendService } from '../../service/api/saluteFrontendService'
import { interviewService } from '../../service/api/interviewService'
import { socketService } from '../../service/realtime/socketService'

interface UseVoiceCallReturn {
  isRecording: boolean
  isAIThinking: boolean
  isAISpeaking: boolean
  isMicrophoneBlocked: boolean
  toggleRecording: () => void
  transcript: string
  aiResponse: string
  error: string | null
}

export const useVoiceCall = (
  sessionId: string,
  position: string,
  isCodeTaskActive: boolean
): UseVoiceCallReturn => {
  const [isRecording, setIsRecording] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Блокируем микрофон, если ИИ думает или говорит
  const isMicrophoneBlocked = isAIThinking || isAISpeaking

  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioChunksRef = useRef<Float32Array[]>([])
  const isCodeTaskActiveRef = useRef(isCodeTaskActive)

  useEffect(() => {
    isCodeTaskActiveRef.current = isCodeTaskActive
    // Если задача началась, принудительно останавливаем запись
    if (isCodeTaskActive && isRecording) {
      stopRecording()
    }
  }, [isCodeTaskActive])

  // Эффект для подписки на события Аудио-сервиса
  useEffect(() => {
    // Когда аудио-сервис говорит "я всё", мы снимаем флаг говорения
    saluteFrontendService.setAudioEndListener(() => {
      console.log('🔊 Audio playback ended, unlocking microphone')
      setIsAISpeaking(false)
    })

    return () => {
      // Очистка при размонтировании
      saluteFrontendService.setAudioEndListener(() => {})
    }
  }, [])
  const startRecording = useCallback(async () => {
    // Строгая блокировка
    if (isMicrophoneBlocked) {
      console.warn('Микрофон заблокирован, пока ИИ активен')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const audioContext = new AudioContext()
      await audioContext.resume()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      scriptProcessorRef.current = processor
      audioChunksRef.current = []

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        audioChunksRef.current.push(new Float32Array(inputData))
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
      setIsRecording(true)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Ошибка подключения к микрофону')
    }
  }, [isMicrophoneBlocked])

  const stopRecording = useCallback(async () => {
    if (!isRecording) return
    setIsRecording(false)
    setIsAIThinking(true) // Блокируем микрофон, переходим в режим ожидания

    const buffers = audioChunksRef.current
    const totalLength = buffers.reduce((acc, b) => acc + b.length, 0)
    const result = new Float32Array(totalLength)
    let offset = 0
    for(const b of buffers) { result.set(b, offset); offset += b.length }

    const resampled = downsampleBuffer(result, audioContextRef.current?.sampleRate || 44100, 16000)
    const pcm = convertFloatTo16BitPCM(resampled)

    stopAudioCapture()

    const blob = new Blob([pcm], { type: 'application/octet-stream' })

    try {
      const text = await saluteFrontendService.recognizeAudio(blob)
      if(text) {
        setTranscript(text)
        socketService.sendTranscript(sessionId, text, position)
        // isAIThinking остается true -> микрофон заблокирован до ответа
      } else {
        setIsAIThinking(false) // Если не распознали, разблокируем
      }
    } catch(e) {
      console.error(e)
      setIsAIThinking(false) // При ошибке разблокируем
      setError('Ошибка распознавания речи')
    }
  }, [isRecording, sessionId, position])

  // Автоматическое включение микрофона после завершения речи ИИ
  useEffect(() => {
    // Если ИИ закончил говорить и думать, и микрофон не записывает, включаем его автоматически
    if (
      !isAISpeaking && 
      !isAIThinking && 
      !isRecording && 
      sessionId && 
      position &&
      socketService.getConnectionState() === 'connected'
    ) {
      // Небольшая задержка, чтобы дать время системе обработать завершение аудио
      const autoStartTimeout = setTimeout(() => {
        // Проверяем еще раз перед включением
        if (
          !isAISpeaking && 
          !isAIThinking && 
          !isRecording && 
          socketService.getConnectionState() === 'connected'
        ) {
          console.log('🎤 Auto-starting microphone after AI finished speaking')
          startRecording()
        }
      }, 500) // 500ms задержка

      return () => clearTimeout(autoStartTimeout)
    }
  }, [isAISpeaking, isAIThinking, isRecording, sessionId, position, startRecording])

  useEffect(() => {
    if (!sessionId || !position) return

    const initSocket = async () => {
      try {
        if (socketService.getConnectionState() === 'disconnected') {
          await interviewService.startInterview(sessionId, position)
        }

        // Обработка обычных полных сообщений
        socketService.onMessage(async (data) => {
          setIsAIThinking(false)
          setAiResponse(data.text)
          setIsAISpeaking(true) // Блокируем микрофон
          await saluteFrontendService.playAudioFromText(data.text)
        })

        // --- STREAMING HANDLERS ---

        socketService.onStreamStart(() => {
          setIsAIThinking(false) // Больше не думает
          setIsAISpeaking(true)  // Теперь говорит (блокируем микрофон)
          setAiResponse("")
        })

        socketService.onStreamChunk((textChunk) => {
          setAiResponse(prev => prev + textChunk)
          saluteFrontendService.playAudioFromText(textChunk)
        })

        socketService.onStreamEnd(() => {
          // Стрим закончился, но мы НЕ разблокируем микрофон здесь.
          // Мы ждем, пока saluteFrontendService.onPlaybackEnded вызовет setIsAISpeaking(false)
          // Это произойдет, когда доиграет последний кусочек из очереди.
        })
      } catch (error) {
        setError(`Ошибка подключения к серверу: ${error}`)
      }
    }

    initSocket()

    return () => {
      interviewService.cleanup()
      saluteFrontendService.stopAudio()
      stopAudioCapture()
    }
  }, [sessionId, position])

  const stopAudioCapture = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect(); sourceRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close(); audioContextRef.current = null
    }
  }

  const toggleRecording = useCallback(() => {
    if (!isRecording && isMicrophoneBlocked) return

    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording, isMicrophoneBlocked])

  return {
    isRecording,
    isAIThinking,
    isAISpeaking,
    isMicrophoneBlocked,
    toggleRecording,
    transcript,
    aiResponse,
    error
  }
}

// Helpers
function downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number): Float32Array {
  if (outSampleRate === sampleRate) return buffer
  if (outSampleRate > sampleRate) return buffer
  const sampleRateRatio = sampleRate / outSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0, count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]; count++
    }
    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult++; offsetBuffer = nextOffsetBuffer
  }
  return result
}

function convertFloatTo16BitPCM(buffer: Float32Array): ArrayBuffer {
  const l = buffer.length
  const buffer16 = new ArrayBuffer(l * 2)
  const view = new DataView(buffer16)
  for (let i = 0; i < l; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]))
    s = s < 0 ? s * 0x8000 : s * 0x7FFF
    view.setInt16(i * 2, s, true)
  }
  return buffer16
}
