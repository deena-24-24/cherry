// src/components/VoiceCallPanel.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useInterviewStore } from '../../store'
import { useVoiceCall } from '../../pages/hooks/useVoiceCall'
import { Button } from '../ui/Button'
import { voiceService } from '../../service/interview/voiceService'
import { socketService } from '../../service/socketService'

interface VoiceCallPanelProps {
  sessionId: string;
  position: string;
  onInterviewCompleted?: (data: any) => void;
}

export const VoiceCallPanel: React.FC<VoiceCallPanelProps> = ({ sessionId, position, onInterviewCompleted }) => {
  const { isCallActive, startCall, endCall } = useInterviewStore()
  const {
    isRecording,
    isAIThinking,
    isAISpeaking,
    toggleRecording,
    transcript,
    aiResponse
  } = useVoiceCall(sessionId, position)

  // Локальные состояния только для UI
  const [isMuted, setIsMuted] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'average' | 'poor'>('good')
  const [voiceActivity, setVoiceActivity] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Реф для кнопки завершения звонка
  const endCallButtonRef = useRef<HTMLButtonElement>(null)

  // Автоматически активируем звонок при монтировании
  useEffect(() => {
    if (!isCallActive) {
      startCall()
    }
  }, [isCallActive, startCall])

  // Мониторинг состояния соединения WebSocket
  useEffect(() => {
    const checkConnection = () => {
      const state = socketService.getConnectionState?.() || 'disconnected'
      setIsConnected(state === 'connected')
    }

    const interval = setInterval(checkConnection, 2000)
    checkConnection() // Проверяем сразу при монтировании

    return () => clearInterval(interval)
  }, [])

  // Имитация изменения качества связи
  useEffect(() => {
    if (!isCallActive) return

    const interval = setInterval(() => {
      const qualities: Array<'good' | 'average' | 'poor'> = ['good', 'average', 'poor']
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)]
      setConnectionQuality(randomQuality)
    }, 5000)

    return () => clearInterval(interval)
  }, [isCallActive])

  // Имитация активности голоса
  useEffect(() => {
    if (!isRecording || isMuted) {
      setVoiceActivity(0)
      return
    }

    const interval = setInterval(() => {
      const baseLevel = transcript.length > 0 ? 30 : 10
      const randomVariation = Math.random() * 40
      setVoiceActivity(Math.min(baseLevel + randomVariation, 100))
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording, transcript, isMuted])

  // НАДЕЖНАЯ ФУНКЦИЯ ЗАВЕРШЕНИЯ ЗВОНКА
  const handleEndCall = useCallback(async () => {
    if (!isCallActive) return

    console.log('🛑 Ending interview call...')

    try {
      // 1. Останавливаем запись если активна
      if (isRecording) {
        toggleRecording()
      }

      // 2. Останавливаем аудио воспроизведение
      await voiceService.stopAudio()

      // 3. Отключаем WebSocket соединение
      socketService.disconnect()

      // 4. Обновляем состояние хранилища
      endCall()

      // 5. Сбрасываем локальные состояния
      setIsMuted(false)
      setVoiceActivity(0)
      setIsConnected(false)

      console.log('✅ Interview call ended successfully')

    } catch (error) {
      console.error('❌ Error ending call:', error)
      // Все равно завершаем звонок даже при ошибках
      endCall()
      socketService.disconnect()
    }
  }, [isCallActive, isRecording, toggleRecording, endCall])

  // НАДЕЖНАЯ ПРИВЯЗКА ОБРАБОТЧИКА К КНОПКЕ
  useEffect(() => {
    const button = endCallButtonRef.current
    if (!button) return

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('🎯 End call button clicked')
      handleEndCall()
    }

    // Добавляем несколько обработчиков для надежности
    button.addEventListener('click', handleClick)
    button.addEventListener('touchstart', handleClick, { passive: false })

    return () => {
      button.removeEventListener('click', handleClick)
      button.removeEventListener('touchstart', handleClick)
    }
  }, [handleEndCall])

  // Обработчик клавиши Escape для завершения звонка
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCallActive) {
        console.log('⌨️ Escape key pressed - ending call')
        handleEndCall()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isCallActive, handleEndCall])

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
    toggleRecording()
  }

  // Визуализатор голосовой активности
  const renderVoiceVisualizer = () => {
    const bars = 8
    return (
      <div className="flex items-end justify-center space-x-1 h-12 mb-4">
        {Array.from({ length: bars }).map((_, index) => {
          const activityForBar = voiceActivity * (1 - Math.abs(index - bars/2) / bars)
          const height = Math.max(10, (activityForBar / 100) * 32)

          return (
            <div
              key={index}
              className="w-2 bg-blue-500 rounded-t transition-all duration-150 ease-in-out"
              style={{ height: `${height}px` }}
            />
          )
        })}
      </div>
    )
  }

  // Индикатор качества связи
  const renderConnectionIndicator = () => {
    const config = {
      good: { color: 'bg-green-500', text: 'Отличное соединение' },
      average: { color: 'bg-yellow-500', text: 'Среднее соединение' },
      poor: { color: 'bg-red-500', text: 'Плохое соединение' }
    }

    const { color, text } = config[connectionQuality]

    return (
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${color} animate-pulse`} />
        <span className="text-sm text-gray-300">{text}</span>
      </div>
    )
  }

  return (
    <div className="voice-call-panel bg-gray-800 rounded-lg p-6 h-full flex flex-col">
      {/* Заголовок с индикаторами */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Голосовое интервью</h3>
        <div className="flex items-center space-x-4">
          {/* Индикатор соединения WebSocket */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm text-gray-300">
              {isConnected ? 'Соединение установлено' : 'Нет соединения'}
            </span>
          </div>

          {/* Индикатор записи */}
          {isRecording && !isMuted && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-400">Запись</span>
            </div>
          )}

          {/* Индикатор мышления AI */}
          {isAIThinking && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-blue-400">AI думает...</span>
            </div>
          )}

          {/* Индикатор речи AI */}
          {isAISpeaking && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-purple-400">AI говорит</span>
            </div>
          )}

          {/* Индикатор микрофона */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className="text-sm text-gray-300">
              {isMuted ? 'Выключен' : 'Включен'}
            </span>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="video-placeholder bg-gray-700 rounded-lg flex-1 flex flex-col items-center justify-center mb-4 p-4">
        <div className="text-center mb-4">
          <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-white text-2xl">AI</span>
          </div>
          <p className="text-lg text-white font-medium">AI Интервьюер</p>

          {isCallActive && (
            <div className="mt-2 text-green-400 text-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Интервью активно
            </div>
          )}
        </div>

        {/* Визуализатор голоса */}
        {isCallActive && !isMuted && renderVoiceVisualizer()}

        {/* Индикатор качества связи */}
        {isCallActive && renderConnectionIndicator()}

        {/* Индикатор речи AI */}
        {isAISpeaking && (
          <div className="mt-4 p-3 bg-purple-500/20 rounded-lg max-w-md border border-purple-500/30">
            <p className="text-sm text-purple-300 text-center">
              🗣️ AI интервьюер говорит...
            </p>
          </div>
        )}

        {/* Визуальные подсказки для пользователя */}
        {isRecording && !isMuted && !transcript && (
          <div className="mt-4 p-3 bg-green-500/20 rounded-lg max-w-md border border-green-500/30">
            <p className="text-sm text-green-300 text-center animate-pulse">
              🎤 Говорите сейчас... Я слушаю
            </p>
          </div>
        )}

        {isRecording && transcript && (
          <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg max-w-md border border-yellow-500/30">
            <p className="text-sm text-yellow-300 text-center">
              🔊 Распознано: {transcript}
            </p>
          </div>
        )}

        {/* Подсказка что делать после ответа AI */}
        {isAISpeaking && (
          <div className="mt-2 p-2 bg-purple-500/10 rounded-lg">
            <p className="text-xs text-purple-400 text-center">
              ⏳ После ответа AI вы сможете продолжить рассказ...
            </p>
          </div>
        )}

        {/* Статус готовности к ответу */}
        {!isRecording && !isAISpeaking && !isAIThinking && isCallActive && (
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg max-w-md border border-blue-500/30">
            <p className="text-sm text-blue-300 text-center">
              ✅ Готов слушать ваш ответ
            </p>
          </div>
        )}

        {/* Текущий транскрипт */}
        {transcript && !isMuted && (
          <div className="mt-4 p-3 bg-black/50 rounded-lg max-w-md">
            <p className="text-sm text-gray-300 text-center">
              {transcript}
            </p>
          </div>
        )}

        {/* Ответ AI */}
        {aiResponse && (
          <div className="mt-4 p-3 bg-blue-500/20 rounded-lg max-w-md border border-blue-500/30">
            <p className="text-sm text-blue-300 text-center">
              🤖 {aiResponse}
            </p>
          </div>
        )}

        {/* Сообщение об ошибке соединения */}
        {!isConnected && isCallActive && (
          <div className="mt-4 p-3 bg-red-500/20 rounded-lg max-w-md border border-red-500/30">
            <p className="text-sm text-red-300 text-center">
              ❌ Нет соединения с сервером. Попытка переподключения...
            </p>
          </div>
        )}
      </div>

      {/* Панель управления */}
      <div className="controls flex flex-col space-y-4">
        <button
          ref={endCallButtonRef}
          onClick={handleEndCall}
          className="px-8 py-4 rounded-full text-lg font-medium bg-red-500 hover:bg-red-600 transform hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isCallActive}
        >
          📞 Завершить собеседование
        </button>

        {/* Дополнительные кнопки управления */}
        {isCallActive && (
          <div className="flex justify-center space-x-4">
            {/* Кнопка mute/unmute */}
            <Button
              onClick={handleToggleMute}
              className={`px-6 py-3 rounded-full transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500/20 text-red-300 border border-red-500 hover:bg-red-500/30'
                  : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
              }`}
            >
              {isMuted ? '🔇 Включить микрофон' : '🎤 Выключить микрофон'}
            </Button>
          </div>
        )}
      </div>

      {/* Статусы */}
      <div className="mt-4 text-center space-y-2">
        {isRecording && !isMuted && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-red-400">Идёт запись аудио...</p>
          </div>
        )}

        {isMuted && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <p className="text-sm text-yellow-400">Микрофон выключен</p>
          </div>
        )}

        {isAIThinking && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-blue-400">AI обрабатывает ответ...</p>
          </div>
        )}

        {/* Статус речи AI */}
        {isAISpeaking && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-purple-400">AI отвечает...</p>
          </div>
        )}

        {/* Статус ожидания пользователя */}
        {!isRecording && !isAISpeaking && !isAIThinking && isCallActive && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-green-400">Ожидаю ваш ответ...</p>
          </div>
        )}

        {/* Подсказка про Escape */}
        {isCallActive && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <p className="text-sm text-gray-400">
              Нажмите Escape для экстренного завершения
            </p>
          </div>
        )}
      </div>
    </div>
  )
}