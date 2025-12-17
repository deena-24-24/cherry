// src/pages/candidate/InterviewCallPage.tsx
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button/Button'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { interviewService } from '../../service/interview/interviewService'
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
  const [isFinishing, setIsFinishing] = useState(false)
  const reportTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref для таймаута ожидания отчета

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

  // src/pages/candidate/InterviewCallPage.tsx

  // InterviewCallPage.tsx - исправленная версия

  // === ПРАВИЛЬНЫЙ ПОРЯДОК ПОДПИСКИ ===

  // 1. Сначала создаем обработчик
  const handleInterviewCompleted = useCallback((data: SocketInterviewCompleted) => {
    console.log('🏁 Interview completed received in InterviewCallPage:', data)

    // ОЧИЩАЕМ ТАЙМАУТ
    if (reportTimeoutRef.current) {
      console.log('⏹️ Clearing report timeout - report received')
      clearTimeout(reportTimeoutRef.current)
      reportTimeoutRef.current = null
    }

    if (data.finalReport) {
      console.log('✅ Setting final report and showing popup')
      setFinalReport(data.finalReport)
      setCompletionReason(data.completionReason || 'Собеседование завершено')
      setWasAutomatic(data.wasAutomatic || false)
      setShowInterrupted(false)
      setShowFinalReport(true)
    } else {
      console.warn('⚠️ Interview completed but no final report received')
      setInterruptionReason(data.completionReason || 'Собеседование завершено без отчета')
      setShowInterrupted(true)
    }

    // Отключаем сокет через 1 секунду, чтобы гарантированно получить все данные
    setTimeout(() => {
      socketService.disconnect()
      endStoreCall()
      setIsFinishing(false)
    }, 1000)
  }, [endStoreCall])

  // 2. ПОДПИСКА В useLayoutEffect - выполняется СИНХРОННО после рендера
  useLayoutEffect(() => {
    console.log('📝 Setting up interview-completed callback in InterviewCallPage (useLayoutEffect)')

    // Устанавливаем колбэк НЕПОСРЕДСТВЕННО в socketService
    socketService.onInterviewCompleted(handleInterviewCompleted)
    console.log('✅ Interview-completed callback set:', !!socketService.getCallbackStatus?.())

    return () => {
      console.log('🧹 Cleaning up interview-completed callback in InterviewCallPage')
      socketService.offInterviewCompleted()
    }
  }, [handleInterviewCompleted])
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

  // 3. Только ПОСЛЕ установки колбэка используем хук useVoiceCall
  // const voiceCall = useVoiceCall(sessionId || '', currentSession?.position || '')

  // 4. Автоматически запускаем звонок при загрузке
  useEffect(() => {
    if (!isCallActive) {
      startStoreCall()
    }
  }, [isCallActive, startStoreCall])

  // 5. Добавляем отдельный эффект для мониторинга состояния колбэка
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔍 Checking callback status:', {
        hasCallback: !!socketService.getCallbackStatus?.() || 'unknown',
        isConnected: socketService.getConnectionState() === 'connected'
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Автоматически запускаем звонок при загрузке
  useEffect(() => {
    if (!isCallActive) {
      startStoreCall()
    }
  }, [isCallActive, startStoreCall])

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

  // src/pages/candidate/InterviewCallPage.tsx

  const handleEndCall = useCallback(async (reason: 'user' | 'system' | 'error' = 'user') => {
    if (!isCallActive) return

    console.log(`🛑 Ending interview call, reason: ${reason}`)

    // 1. Сразу останавливаем запись и аудио
    if (isRecording) toggleRecording()
    voiceService.stopAudio()

    try {
      if (reason === 'user') {
        setIsFinishing(true)

        // Проверяем, что колбэк установлен перед отправкой запроса
        console.log('🔍 Callback status before sending complete:', {
          hasCallback: !!socketService.getCallbackStatus?.()
        })

        const sent = socketService.sendCompleteInterview(sessionId || '')

        if (sent) {
          console.log('⏳ Waiting for final report...')

          if (reportTimeoutRef.current) {
            clearTimeout(reportTimeoutRef.current)
            reportTimeoutRef.current = null
          }

          // Увеличиваем таймаут до 15 секунд
          reportTimeoutRef.current = setTimeout(() => {
            if (isCallActive && !showFinalReport) {
              console.warn('⚠️ Timeout waiting for report, forcing disconnect')
              setInterruptionReason('Не удалось получить финальный отчет')
              setShowInterrupted(true)
              forceDisconnect('timeout')
            }
            reportTimeoutRef.current = null
          }, 15000)

          return // Ждем события interview-completed
        }
      }

      forceDisconnect(reason)

    } catch (error) {
      console.error('❌ Error ending call:', error)
      forceDisconnect('error')
    }
  }, [isCallActive, isRecording, toggleRecording, sessionId, showFinalReport])

  // Вынесите логику отключения в отдельную функцию для переиспользования
  const forceDisconnect = (reason: string) => {
    socketService.disconnect()
    endStoreCall()
    setVoiceActivity(0)
    setIsConnected(false)
    setIsFinishing(false)

    // Если был таймаут или ошибка — показываем "Прервано", иначе отчет должен был прийти сам
    if (reason !== 'completed') {
      setInterruptionReason(reason === 'user' ? 'Собеседование прервано кандидатом' : 'Связь потеряна')
      setShowInterrupted(true)
    }
  }

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
        </div>

        {/* Основной контент */}
        <div className={styles['interview-main']}>

          <div className={`${styles['block']} ${styles['ai-block']}`}>
            <h2>ИИ-СОБЕСЕДУЮЩИЙ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>🤖</span>
            </div>
            {/*<div className={styles['talking-row']}>
              <div className={styles['talking-dot']}></div>
              <span className={styles['talking-text']}>Говорит...</span>
            </div>*/}
          </div>

          <div className={`${styles['block']} ${styles['user-block']}`}>
            <h2>КАНДИДАТ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>👤</span>
            </div>
            <p className={styles['subtitle']}>Вы</p>
          </div>


          {/* Голосовая панель */}
          <aside className={styles["panel"]}>
            {/* Header */}
            <header className={styles['header']}>
              <span className={styles['status']}>
                <i className={isConnected ? styles['online'] : styles['offline']} />
                {isConnected ? (
                  <div className={styles['connection']}>
                    <div className={styles['dot']}></div>
                    Подключено
                  </div>)
                  : 'Нет подключения'}
              </span>

              {(isAISpeaking || isAIThinking) && (
                <span className={styles['aiLive']}>
                  {isAISpeaking ? 'ИИ говорит…' : 'ИИ думает…'}
                </span>
              )}
            </header>

            {/* AI block */}
            <div className={styles['ai']}>
              {aiResponse && (
                <div className={styles['subtitle']}>
                  “{aiResponse}”
                </div>
              )}
            </div>

            {/* User transcript */}
            <div className={styles['user']}>
              <div className={styles['userLabel']}>
                🎤 Вы {isRecording && <span className={styles['recording']} />}
              </div>

              <div className={styles['transcript']}>
                {transcript || 'Здесь отобразится Ваш ответ…'}
              </div>
            </div>

            {/* Нижняя панель управления */}
            <footer className={styles['bottom-controls']}>
              <Button
                className={styles['round-btn']}
                variant={"secondary"}
                onClick={() => setShowNotes(!showNotes)}>📝</Button>

              <Button
                className={styles['round-btn']}
                variant="secondary"
                onClick={() => setShowConsole(!showConsole)}>💻</Button>

              <button
                className={styles['mic']}
                onClick={toggleRecording}>
                {isRecording ? 'Выключить микрофон' : 'Включить микрофон'} </button>

              <button
                className={styles['end']}
                onClick={() => handleEndCall('user')}>
                Завершить собеседование </button>
            </footer>
          </aside>
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
    </div>
  )
}