// src/pages/candidate/InterviewCallPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button/Button'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { interviewService } from '../../service/interview/InterviewService'
import { ROUTES } from '../../router/routes'
import { FinalReportPopup } from '../../components/interview/FinalReportPopup'
import { FinalReport, SocketInterviewCompleted } from '../../types'
import { InterviewInterruptedPopup } from '../../components/interview/InterviewInterruptedPopup'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { voiceService } from '../../service/interview/voiceService'
import { socketService } from '../../service/socketService'
import * as styles from './InterviewCallPage.module.css'

export const InterviewCallPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const {
    currentSession,
    isLoading,
    error,
    fetchSession,
    isCallActive,
    startCall: startStoreCall,
    endCall: endStoreCall
  } = useInterviewStore()

  // === СОСТОЯНИЯ ДЛЯ ВСЕЙ СТРАНИЦЫ ===
  const [showNotes, setShowNotes] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)
  const [completionReason, setCompletionReason] = useState<string>('')
  const [wasAutomatic, setWasAutomatic] = useState<boolean>(false)
  const [showInterrupted, setShowInterrupted] = useState(false)
  const [interruptionReason, setInterruptionReason] = useState<string>('')

  // === СОСТОЯНИЯ ДЛЯ ГОЛОСОВОЙ ЧАСТИ ===
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'average' | 'poor'>('good')
  const [voiceActivity, setVoiceActivity] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (showConsole || showNotes) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [showConsole, showNotes])

  // === ИСПОЛЬЗУЕМ ГОЛОСОВОЙ ХУК ===
  const {
    isRecording,
    isAIThinking,
    isAISpeaking,
    toggleRecording,
    transcript,
    aiResponse,
    error: voiceError
  } = useVoiceCall(sessionId || '', currentSession?.position || '')

  // === ЭФФЕКТЫ ===

  // Загрузка сессии
  useEffect(() => {
    const controller = new AbortController()

    const loadSession = async () => {
      try {
        const idToFetch = sessionId || 'session_1'
        await fetchSession(idToFetch, { signal: controller.signal })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('Запрос отменен')
        } else {
          console.error('Ошибка загрузки сессии:', error)
        }
      }
    }

    void loadSession()

    return () => {
      controller.abort()
    }
  }, [sessionId, fetchSession])

  // Автоматически запускаем звонок при загрузке
  useEffect(() => {
    if (!isCallActive) {
      startStoreCall()
    }
  }, [isCallActive, startStoreCall])

  // Обработчик завершения интервью через WebSocket
  const handleInterviewCompleted = useCallback((data: SocketInterviewCompleted) => {
    console.log('🏁 Interview completed received:', data)

    if (data.wasAutomatic && data.finalReport) {
      setFinalReport(data.finalReport)
      setCompletionReason(data.completionReason || 'Собеседование завершено автоматически')
      setWasAutomatic(true)
      setShowFinalReport(true)
    }

    endStoreCall()
  }, [endStoreCall])

  // Подписка на WebSocket события
  useEffect(() => {
    interviewService.onInterviewCompleted(handleInterviewCompleted)

    return () => {
      interviewService.offInterviewCompleted(handleInterviewCompleted)
    }
  }, [handleInterviewCompleted])

  // Мониторинг состояния соединения WebSocket
  useEffect(() => {
    const checkConnection = () => {
      const state = socketService.getConnectionState?.() || 'disconnected'
      setIsConnected(state === 'connected')
    }

    const interval = setInterval(checkConnection, 2000)
    checkConnection()

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
    if (!isRecording || !isCallActive) {
      setVoiceActivity(0)
      return
    }

    const interval = setInterval(() => {
      const baseLevel = transcript.length > 0 ? 30 : 10
      const randomVariation = Math.random() * 40
      setVoiceActivity(Math.min(baseLevel + randomVariation, 100))
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording, transcript, isCallActive])

  // Обработчик клавиши Escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCallActive) {
        console.log('⌨️ Escape key pressed - ending call')
        handleEndCall('user').then()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isCallActive])

  // === ОБРАБОТЧИКИ ===

  // Функция завершения звонка
  const handleEndCall = useCallback(async (reason: 'user' | 'system' | 'error' = 'user') => {
    if (!isCallActive) return

    console.log(`🛑 Ending interview call, reason: ${reason}`)

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
      endStoreCall()

      // 5. Сбрасываем локальные состояния
      setVoiceActivity(0)
      setIsConnected(false)

      // 6. Показываем соответствующий попап
      if (reason === 'user') {
        setInterruptionReason('Собеседование прервано кандидатом')
        setShowInterrupted(true)
      }

      console.log('✅ Interview call ended successfully')

    } catch (error) {
      console.error('❌ Error ending call:', error)
      endStoreCall()
      socketService.disconnect()
      setInterruptionReason('Ошибка при завершении звонка')
      setShowInterrupted(true)
    }
  }, [isCallActive, isRecording, toggleRecording, endStoreCall])

  const handleCloseReport = useCallback(() => {
    setShowFinalReport(false)
    setFinalReport(null)
    navigate(ROUTES.HOME)
  }, [navigate])

  const handleCloseInterruption = useCallback(() => {
    setShowInterrupted(false)
    setInterruptionReason('')
    navigate(ROUTES.HOME)
  }, [navigate])

  const closeSidePanels = () => {
    setShowNotes(false)
    setShowConsole(false)
  }

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РЕНДЕРИНГА ГОЛОСОВОЙ ЧАСТИ ===

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

  // === РЕНДЕРИНГ ===

  if (isLoading) {
    return <div className={styles['loading-screen']}>Загрузка собеседования...</div>
  }

  if (error || !currentSession) {
    return (
      <div className={styles['loading-screen']}>
        <p className="text-red-400">{error || 'Сессия не найдена'}</p>
        <Button onClick={() => navigate(ROUTES.HOME)} className={styles['back-btn']}>
          Вернуться на главную
        </Button>
      </div>
    )
  }

  return (
    <div className={styles['call-page']}>
      {/* Основная область */}
      <div className={styles['call-header']}>
        {/* Хедер */}

        <div className={styles['header-right']}>
          <div className={styles['session-info']}>
            <h1>{currentSession.title}</h1>
            <span className={styles['session-label']}>{currentSession.position}</span>
          </div>
          <div className={styles['connection']}>
            <div className={styles['dot']}></div>
            Connected
          </div>
        </div>

        {/* Основной контент */}
        <div className={styles['interview-main']}>

          <div className={`ai-block ${styles['block']}`}>
            <h2>ИИ-СОБЕСЕДУЮЩИЙ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>🤖</span>
            </div>
            <div className={styles['talking-row']}>
              <div className={styles['talking-dot']}></div>
              <span className={styles['talking-text']}>Говорит...</span>
            </div>
          </div>

          <div className={`user-block ${styles['block']}`}>
            <h2>КАНДИДАТ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>👤</span>
            </div>
            <p className={styles['subtitle']}>Вы</p>
          </div>


          {/* Правая часть - голосовая панель */}
          <div className="w-1/3 bg-gray-800 border-l border-gray-700 p-6">
            <div className="voice-call-panel bg-gray-800 rounded-lg p-6 h-full flex flex-col">
              {/* Заголовок с индикаторами */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {/* Индикатор соединения WebSocket */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-sm text-gray-300">
                      {isConnected ? 'Соединение установлено' : 'Нет соединения'}
                    </span>
                  </div>

                  {/* Индикатор записи */}
                  {isRecording && (
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
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-300">
                      {isRecording ? 'Включен' : 'Выключен'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Основной контент голосового звонка */}
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
                {isCallActive && isRecording && renderVoiceVisualizer()}

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

                {/* Визуальные подсказки */}
                {isRecording && !transcript && (
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

              {/* Панель управления звонком */}
              <div className="controls flex flex-col space-y-4">
                <button
                  onClick={async () => {
                    try {
                      await handleEndCall('user')
                    } catch (error) {
                      console.error('Ошибка при завершении звонка:', error)
                    }
                  }}
                  className="px-8 py-4 rounded-full text-lg font-medium bg-red-500 hover:bg-red-600 transform hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isCallActive}
                >
                  ⏸️ Прервать собеседование
                </button>

                {/* Кнопка mute/unmute */}
                {isCallActive && (
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={toggleRecording}
                      className={`px-6 py-3 rounded-full transition-all duration-200 ${
                        isRecording
                          ? 'bg-red-500/20 text-red-300 border border-red-500 hover:bg-red-500/30'
                          : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      {isRecording ? '🔇 Выключить микрофон' : '🎤 Включить микрофон'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Статусы звонка */}
              <div className="mt-4 text-center space-y-2">
                {isRecording && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-red-400">Идёт запись аудио...</p>
                  </div>
                )}

                {!isRecording && (
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

                {isAISpeaking && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-purple-400">AI отвечает...</p>
                  </div>
                )}

                {!isRecording && !isAISpeaking && !isAIThinking && isCallActive && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm text-green-400">Ожидаю ваш ответ...</p>
                  </div>
                )}

                {isCallActive && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <p className="text-sm text-gray-400">
                      Нажмите Escape для экстренного завершения
                    </p>
                  </div>
                )}

                {voiceError && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-red-400">Ошибка: {voiceError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя панель управления */}
        <div className={styles['bottom-controls']}>
          <Button
            className={styles['round-btn']}
            variant={"secondary"}
            onClick={() => setShowNotes(!showNotes)}
          >
            📝
          </Button>

          <Button
            className={styles['round-btn']}
            variant="secondary"
            onClick={() => setShowConsole(!showConsole)}
          >
            💻
          </Button>
        </div>
      </div>

      {/* Боковая панель для заметок и консоли */}
      <div className={`${styles['side-overlay']} ${showNotes || showConsole ? styles['open'] : ''}`} onClick={closeSidePanels}>
        <aside className={`${styles['side-panel']} ${showNotes || showConsole ? styles['open'] : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className={styles['tabs']}>
            <button
              onClick={() => { setShowNotes(true); setShowConsole(false) }}
              className={`${styles["tab"]} ${showNotes? styles['active'] : ''}`}>
              📝 Заметки
            </button>
            <button
              onClick={() => { setShowConsole(true); setShowNotes(false) }}
              className={`${styles['tab']} ${showConsole ? styles['active'] : ''}`} >
              💻 Код
            </button>
          </div>

          <div className={styles['panel-content']}>
            {showNotes && <NotesPanel />}
            {showConsole && sessionId && <CodeConsole sessionId={sessionId} />}
          </div>
        </aside>
      </div>

      {/* Попапы */}
      {showFinalReport && (
        <FinalReportPopup
          report={finalReport}
          completionReason={completionReason}
          wasAutomatic={wasAutomatic}
          onClose={handleCloseReport}
        />
      )}

      {showInterrupted && (
        <InterviewInterruptedPopup
          reason={interruptionReason}
          onClose={handleCloseInterruption}
        />
      )}
    </div>
  )
}