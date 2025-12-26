import { useState, useRef, useEffect, useCallback } from 'react'
import { saluteFrontendService } from '../../service/api/saluteFrontendService'
import { interviewService } from '../../service/api/interviewService'
import { socketService } from '../../service/realtime/socketService'

const AVAILABLE_VOICES = [
  'Nec_24000', 'Bys_24000',
  'Tur_24000', 'Ost_24000',
  'Pon_24000', 'Bin_24000',
  'May_24000'
]

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
  isCodeTaskActive: boolean,
  isInterviewEnded: boolean
): UseVoiceCallReturn => {
  const [isRecording, setIsRecording] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Блокируем микрофон, если ИИ думает или говорит
  const isMicrophoneBlocked = isAIThinking || isAISpeaking || isInterviewEnded

  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioChunksRef = useRef<Float32Array[]>([])
  const isCodeTaskActiveRef = useRef(isCodeTaskActive)

  // Выбираем случайный голос один раз при инициализации хука
  useEffect(() => {
    const randomVoice = AVAILABLE_VOICES[Math.floor(Math.random() * AVAILABLE_VOICES.length)]
    // Устанавливаем его в сервис
    saluteFrontendService.setVoice(randomVoice)

    console.log(`🎤 Выбран голос собеседника: ${randomVoice}`)
  }, [])

  // Если началась задача или интервью завершено - останавливаем запись
  useEffect(() => {
    isCodeTaskActiveRef.current = isCodeTaskActive
    if ((isCodeTaskActive || isInterviewEnded) && isRecording) {
      stopRecording()
    }
  }, [isCodeTaskActive, isInterviewEnded])

  // Эффект для подписки на события Аудио-сервиса
  useEffect(() => {
    saluteFrontendService.setAudioEndListener(() => {
      setIsAISpeaking(false)
    })

    return () => {
      saluteFrontendService.setAudioEndListener(() => {})
    }
  }, [])

  const startRecording = useCallback(async () => {
    // Строгая блокировка
    if (isMicrophoneBlocked) {
      console.warn('Микрофон заблокирован')
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

    // Если интервью завершено, не переходим в режим "думает"
    if (!isInterviewEnded) {
      setIsAIThinking(true)
    }

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
        setIsAIThinking(false)
      }
    } catch(e) {
      console.error(e)
      setIsAIThinking(false)
      setError('Ошибка распознавания речи')
    }
  }, [isRecording, sessionId, position, isInterviewEnded])

  // Автоматическое включение микрофона после завершения речи ИИ
  useEffect(() => {
    // Если ИИ закончил говорить и думать, и микрофон не записывает, включаем его автоматически
    if (
      !isAISpeaking &&
      !isAIThinking &&
      !isRecording &&
      !isInterviewEnded &&
      sessionId &&
      position &&
      socketService.getConnectionState() === 'connected'
    ) {
      const autoStartTimeout = setTimeout(() => {
        if (
          !isAISpeaking &&
          !isAIThinking &&
          !isRecording &&
          !isInterviewEnded &&
          socketService.getConnectionState() === 'connected'
        ) {
          startRecording()
        }
      }, 500)

      return () => clearTimeout(autoStartTimeout)
    }
  }, [isAISpeaking, isAIThinking, isRecording, sessionId, position, startRecording, isInterviewEnded])

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
          setIsAISpeaking(true)
          await saluteFrontendService.playAudioFromText(data.text)
        })

        // --- STREAMING HANDLERS ---

        socketService.onStreamStart(() => {
          setIsAIThinking(false)
          setIsAISpeaking(true)
          setAiResponse("")
        })

        socketService.onStreamChunk((textChunk) => {
          setAiResponse(prev => prev + textChunk)
          saluteFrontendService.playAudioFromText(textChunk)
        })

        socketService.onStreamEnd(() => {
          // Stream ended
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
