import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button/Button'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { ROUTES } from '../../router/routes'
import { FinalReportPopup } from '../../components/popup/FinalReportPopup'
import { FinalReport, SocketInterviewCompleted } from '../../types'
import { InterviewInterruptedPopup } from '../../components/popup/InterviewInterruptedPopup'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { saluteFrontendService } from '../../service/api/saluteFrontendService'
import { socketService } from '../../service/realtime/socketService'
import * as styles from './InterviewCallPage.module.css'
import { API_URL } from '../../config'
import { Loader } from '../../components/ui/Loader/Loader'

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
    endCall: endStoreCall,
    notes
  } = useInterviewStore()

  // === СОСТОЯНИЯ ДЛЯ ВСЕЙ СТРАНИЦЫ ===
  const [showNotes, setShowNotes] = useState(false)
  const [showConsole, setShowConsole] = useState(false)

  // Состояния завершения
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)

  // Блокирующий стейт: интервью завершено, идет генерация отчета
  const [isInterviewEnded, setIsInterviewEnded] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const [completionReason, setCompletionReason] = useState<string>('')
  const [wasAutomatic, setWasAutomatic] = useState<boolean>(false)

  // Ошибки и прерывания
  const [showInterrupted, setShowInterrupted] = useState(false)
  const [interruptionReason, setInterruptionReason] = useState<string>('')

  // === ПРАКТИЧЕСКАЯ ЗАДАЧА ===
  const [isCodeTaskActive, setIsCodeTaskActive] = useState(false)
  const [codeTaskTimeRemaining, setCodeTaskTimeRemaining] = useState<number | null>(null)
  const [codeTaskScore, setCodeTaskScore] = useState<number | null>(null)

  const codeTaskTimerRef = useRef<NodeJS.Timeout | null>(null)
  const taskCompletedRef = useRef(false) // Чтобы не запустить дважды

  const [isConnected, setIsConnected] = useState(false)
  const [interviewPosition, setInterviewPosition] = useState<string | null>(null)
  const [_voiceActivity, setVoiceActivity] = useState(0)

  // Refs для таймеров
  const reportTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Блокировка скролла
  useEffect(() => {
    if (showConsole || showNotes) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showConsole, showNotes])

  // Загрузка сессии
  useEffect(() => {
    const controller = new AbortController()
    const loadSession = async () => {
      try {
        const idToFetch = sessionId || 'session_1'
        await fetchSession(idToFetch, { signal: controller.signal })
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Ошибка загрузки сессии:', error)
        }
      }
    }
    void loadSession()
    return () => { controller.abort() }
  }, [sessionId, fetchSession])

  useEffect(() => {
    if (currentSession?.position) {
      setInterviewPosition(currentSession.position)
    }
  }, [currentSession?.position])

  // === VOICE HOOK ===
  const shouldInitVoice = !!sessionId && !!interviewPosition
  const {
    isRecording,
    isAIThinking,
    isAISpeaking,
    isMicrophoneBlocked,
    toggleRecording,
    transcript,
    aiResponse
  } = useVoiceCall(
    shouldInitVoice ? sessionId! : '',
    shouldInitVoice ? interviewPosition! : '',
    isCodeTaskActive
  )

  // === ЛОГИКА ПРАКТИЧЕСКОЙ ЗАДАЧИ ===

  // 1. Обнаружение задачи в ответе ИИ
  useEffect(() => {
    if (!aiResponse || isCodeTaskActive || taskCompletedRef.current) return

    const lowerResponse = aiResponse.toLowerCase()

    // Фразы-триггеры из бэкенда
    const triggers = [
      'даю тебе 10 минут на выполнение задачи',
      'задачу у консоли',
      'задача у консоли',
      'код в консоли'
    ]

    const hasTrigger = triggers.some(t => lowerResponse.includes(t))

    if (hasTrigger) {
      startCodeTask()
    }
  }, [aiResponse, isCodeTaskActive])

  // 2. Старт задачи
  const startCodeTask = useCallback(() => {
    setIsCodeTaskActive(true)
    setCodeTaskTimeRemaining(10 * 60) // 10 минут
    setShowConsole(true)
    setShowNotes(false)
    taskCompletedRef.current = false

    // Запускаем таймер
    codeTaskTimerRef.current = setInterval(() => {
      setCodeTaskTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleTaskComplete(false) // Время вышло
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // 3. Завершение задачи (вызывается из CodeConsole или по таймеру)
  const handleTaskComplete = useCallback(async (allTestsPassed: boolean) => {
    if (taskCompletedRef.current) return // Защита от двойного вызова
    taskCompletedRef.current = true

    // Остановка таймера
    if (codeTaskTimerRef.current) {
      clearInterval(codeTaskTimerRef.current)
      codeTaskTimerRef.current = null
    }

    setIsCodeTaskActive(false)
    setCodeTaskScore(allTestsPassed ? 1 : 0)

    // Закрываем консоль через паузу для UX
    setTimeout(() => {
      setShowConsole(false)
    }, 3000)

    // Отправка результата на сервер
    if (sessionId) {
      try {
        await fetch(`${API_URL}/api/interview/sessions/${sessionId}/code-task-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            score: allTestsPassed ? 1 : 0,
            allTestsPassed,
            completedAt: new Date().toISOString()
          })
        })

        // Сообщаем ИИ, что задача выполнена, чтобы он продолжил диалог
        const message = allTestsPassed
          ? "Я успешно выполнил практическое задание, все тесты прошли. Готов продолжать."
          : "Я завершил практическое задание, но не все тесты прошли. Готов продолжать."

        socketService.sendTranscript(sessionId, message, interviewPosition || 'frontend')

      } catch (e) {
        console.error("Ошибка отправки результата задачи:", e)
      }
    }
  }, [sessionId, interviewPosition])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // === 2. Обработка ГОТОВОГО ОТЧЕТА (Socket + HTTP Handler) ===
  const handleInterviewCompleted = useCallback((data: SocketInterviewCompleted) => {
    // Если уже загрузили отчет (например, через HTTP раньше сокета), игнорируем
    // Но проверяем isGeneratingReport, так как он сбрасывается первым
    setFinalReport((prev) => {
      if (prev) return prev // Уже есть отчет

      // Очищаем таймеры
      if (reportTimeoutRef.current) {
        clearTimeout(reportTimeoutRef.current)
        reportTimeoutRef.current = null
      }
      stopPolling()

      setIsGeneratingReport(false)

      if (data.finalReport && data.finalReport.overall_assessment) {
        setCompletionReason(data.completionReason || 'Собеседование завершено')
        setWasAutomatic(data.wasAutomatic || false)
        setShowInterrupted(false)
        setShowFinalReport(true)
        return data.finalReport
      } else {
        console.error("❌ Invalid report structure received:", data.finalReport)
        setInterruptionReason('Ошибка: отчет сформирован некорректно. Проверьте историю в профиле.')
        setShowInterrupted(true)
        setShowFinalReport(false)
        return null
      }
    })

    socketService.disconnect()
    endStoreCall()
  }, [endStoreCall, stopPolling])

  // === ФУНКЦИЯ ДЛЯ ПОЛЛИНГА ОТЧЕТА (HTTP FALLBACK) ===
  const startPollingForReport = useCallback(() => {
    if (pollingIntervalRef.current) return // Уже опрашиваем

    let pollCount = 0
    const maxPolls = 20 // Максимум 20 попыток (60 секунд)

    pollingIntervalRef.current = setInterval(async () => {
      if (!sessionId) return
      
      pollCount++
      
      // Останавливаем поллинг после максимального количества попыток
      if (pollCount > maxPolls) {
        stopPolling()
        console.warn("⏱️ Polling timeout: report not received after 60 seconds")
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/report`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          // Подавляем вывод ошибок в консоль браузера для 404
          // Используем signal для возможности отмены
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.report) {
            stopPolling() // Останавливаем поллинг после получения отчета
            handleInterviewCompleted({
              sessionId,
              finalReport: data.report,
              completionReason: "Завершено (HTTP)",
              wasAutomatic: true
            })
          }
        } else if (response.status === 404) {
          // 404 - отчет еще не готов, это нормально, продолжаем поллинг
          // Браузер все равно покажет это в консоли, но это ожидаемое поведение
          // Можно игнорировать эти сообщения в DevTools
        } else {
          console.warn(`⚠️ Polling failed with status ${response.status}, retrying...`)
        }
      } catch (err) {
        // Игнорируем ошибки сети, если это не последняя попытка
        if (pollCount < maxPolls) {
          // Не логируем каждую ошибку сети, чтобы не засорять консоль
        } else {
          console.warn("⚠️ Polling failed after all attempts:", err)
        }
      }
    }, 3000) // Опрос каждые 3 секунды
  }, [sessionId, handleInterviewCompleted])

  // === 1. Обработка НАЧАЛА ЗАВЕРШЕНИЯ ===
  useEffect(() => {
    const onCompletionStart = () => {
      setIsInterviewEnded(true)
      setIsGeneratingReport(true)
      setShowFinalReport(true)

      // Запускаем поллинг как подстраховку от разрыва сокета
      startPollingForReport()
    }

    socketService.onCompletionStarted(onCompletionStart)
    return () => {
      socketService.offCompletionStarted()
      stopPolling()
    }
  }, [startPollingForReport, stopPolling])

  useLayoutEffect(() => {
    socketService.onInterviewCompleted(handleInterviewCompleted)
    return () => {
      socketService.offInterviewCompleted()
    }
  }, [handleInterviewCompleted])

  // Старт звонка в сторе
  useEffect(() => {
    if (!isCallActive && !isInterviewEnded) startStoreCall()
  }, [isCallActive, startStoreCall, isInterviewEnded])

  // Проверка коннекта
  useEffect(() => {
    const checkConnection = () => {
      const state = socketService.getConnectionState?.() || 'disconnected'
      setIsConnected(state === 'connected')
    }
    const interval = setInterval(checkConnection, 2000)
    checkConnection()
    return () => clearInterval(interval)
  }, [])

  // Текст кнопки
  const getMicButtonText = () => {
    if (isInterviewEnded) return 'Собеседование завершено'
    if (isRecording) return 'Остановить и отправить'
    if (isAIThinking) return 'ИИ думает...'
    if (isAISpeaking) return 'ИИ говорит...'
    return 'Включить микрофон'
  }

  // Визуализация
  useEffect(() => {
    if (!isRecording || !isCallActive) {
      setVoiceActivity(0)
      return
    }
    const interval = setInterval(() => {
      const baseLevel = transcript.length > 0 ? 30 : 10
      setVoiceActivity(Math.min(baseLevel + Math.random() * 40, 100))
    }, 100)
    return () => clearInterval(interval)
  }, [isRecording, transcript, isCallActive, isCodeTaskActive])

  // Ручное завершение кнопкой "Завершить"
  const handleEndCall = useCallback(async (_reason: 'user' | 'system' | 'error' = 'user') => {
    if (!isCallActive || isInterviewEnded) return

    setIsInterviewEnded(true)
    setIsGeneratingReport(true)
    setShowFinalReport(true) // Показываем лоадер

    // Запускаем поллинг
    startPollingForReport()

    if (isRecording) toggleRecording()
    saluteFrontendService.stopAudio()

    try {
      socketService.sendCompleteInterview(sessionId || '')

      // Тайм-аут на случай, если вообще ничего не произойдет 60 сек
      reportTimeoutRef.current = setTimeout(() => {
        // Проверяем через реф, т.к. замыкание может быть старым,
        // но лучше проверить наличие finalReport в стейте
        setFinalReport(currentReport => {
          if (!currentReport) {
            stopPolling()
            setIsGeneratingReport(false)
            setShowFinalReport(false)
            setInterruptionReason('Сервер долго формирует отчет. Результаты будут доступны позже в личном кабинете.')
            setShowInterrupted(true)
          }
          return currentReport
        })
      }, 60000)
    } catch (error) {
      console.error('Error ending call:', error)
      setIsGeneratingReport(false)
      setShowFinalReport(false)
      stopPolling()
    }
  }, [isCallActive, isInterviewEnded, isRecording, toggleRecording, sessionId, startPollingForReport, stopPolling])


  const handleCloseReport = useCallback(() => {
    setShowFinalReport(false)
    setFinalReport(null)
    stopPolling()
    navigate(ROUTES.INTERVIEW_HOME)
  }, [navigate, stopPolling])

  const handleCloseInterruption = useCallback(() => {
    setShowInterrupted(false)
    setInterruptionReason('')
    navigate(ROUTES.HOME)
  }, [navigate])

  const closeSidePanels = () => {
    setShowNotes(false)
    setShowConsole(false)
  }

  if (isLoading || !currentSession || !interviewPosition) {
    return <Loader />
  }

  if (error) return <div className={styles['loading-screen']}><p className="text-red-400">{error}</p><Button onClick={() => navigate(ROUTES.HOME)} className={styles['back-btn']}>Вернуться на главную</Button></div>

  const isMicDisabled = isInterviewEnded || isMicrophoneBlocked

  return (
    <div className={styles['call-page']}>
      <div className={styles['call-header']}>
        <div className={styles['header-right']}>
          <div className={styles['session-info']}>
            <h1>{currentSession.title}</h1>
            <span className={styles['session-label']}>{currentSession.position}</span>
          </div>
        </div>

        <div className={styles['interview-main']}>
          {/* AI BLOCK */}
          <div className={`${styles['block']} ${styles['ai-block']}`}>
            <h2>ИИ-СОБЕСЕДУЮЩИЙ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>🤖</span>
            </div>
          </div>

          {/* USER BLOCK */}
          <div className={`${styles['block']} ${styles['user-block']}`}>
            <h2>КАНДИДАТ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>👤</span>
            </div>
            <p className={styles['subtitle']}>Вы</p>
          </div>

          {/* CONTROL PANEL */}
          <aside className={styles["panel"]}>
            <header className={styles['header']}>
              <span className={styles['status']}>
                <i className={isConnected ? styles['online'] : styles['offline']} />
                {isConnected ? <div className={styles['connection']}>Подключено</div> : 'Нет подключения'}
              </span>
              {!isInterviewEnded && (isAISpeaking || isAIThinking) && (
                <span className={styles['aiLive']}>
                  {isAIThinking ? '⚡ Генерирует ответ...' : '🔊 Озвучивает...'}
                </span>
              )}
            </header>

            <div className={styles['ai']}>
              {aiResponse && (
                <div className={styles['subtitle']}>
                  &#34;{aiResponse}&#34;
                </div>
              )}
              {isCodeTaskActive && (
                <div className={styles['task-indicator']}>
                  <span className={styles['task-badge']}>⏱️ Практическая задача активна</span>
                  {codeTaskTimeRemaining !== null && (
                    <span className={styles['task-timer']}>
                      {Math.floor(codeTaskTimeRemaining / 60)}:{(codeTaskTimeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              )}
              {codeTaskScore !== null && !isCodeTaskActive && (
                <div className={styles['task-result']}>
                  {codeTaskScore === 1 ? (
                    <span className={styles['task-success']}>✅ Задача выполнена (+1 балл)</span>
                  ) : (
                    <span className={styles['task-fail']}>❌ Задача не выполнена (0 баллов)</span>
                  )}
                </div>
              )}
            </div>

            <div className={styles['user']}>
              <div className={styles['userLabel']}>🎤 Вы {isRecording && <span className={styles['recording']} />}</div>
              <div className={styles['transcript']}>
                {transcript || (isRecording ? 'Слушаю вас...' : 'Нажмите микрофон и говорите...')}
              </div>
            </div>

            <footer className={styles['bottom-controls']}>
              <Button
                className={styles['round-btn']}
                variant={"secondary"}
                onClick={() => setShowNotes(!showNotes)}
                disabled={isInterviewEnded}
              >
                📝
              </Button>
              <Button
                className={styles['round-btn']}
                variant="secondary"
                onClick={() => setShowConsole(!showConsole)}
                disabled={isInterviewEnded}
              >
                💻
              </Button>

              <button
                className={`${styles['mic']} ${isMicDisabled ? 'opacity-50 cursor-not-allowed bg-gray-600' : ''}`}
                onClick={toggleRecording}
                disabled={isMicDisabled}
                style={{
                  backgroundColor: isRecording ? '#ff3b3b' : (isMicDisabled ? '#4b5563' : '#2a2f3a'),
                  cursor: isMicDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {getMicButtonText()}
              </button>

              <button
                className={`${styles['end']} ${isInterviewEnded ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleEndCall('user')}
                disabled={isInterviewEnded}
              >
                Завершить
              </button>
            </footer>
          </aside>
        </div>

        {/* SIDE PANELS */}
        <div className={`${styles['side-overlay']} ${showNotes || showConsole ? styles['open'] : ''}`} onClick={closeSidePanels}>
          <aside className={`${styles['side-panel']} ${showNotes || showConsole ? styles['open'] : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles['tabs']}>
              <button onClick={() => { setShowNotes(true); setShowConsole(false) }} className={`${styles["tab"]} ${showNotes? styles['active'] : ''}`}>📝 Заметки</button>
              <button onClick={() => { setShowConsole(true); setShowNotes(false) }} className={`${styles['tab']} ${showConsole ? styles['active'] : ''}`} >💻 Код</button>
            </div>
            <div className={styles['panel-content']}>
              {showNotes && <NotesPanel />}
              {showConsole && sessionId && (
                <CodeConsole
                  sessionId={sessionId}
                  isTaskMode={isCodeTaskActive}
                  timeRemaining={codeTaskTimeRemaining}
                  onTaskComplete={handleTaskComplete}
                />
              )}
            </div>
          </aside>
        </div>

        {/* --- POPUP: ФИНАЛЬНЫЙ ОТЧЕТ --- */}
        {showFinalReport && (
          <FinalReportPopup
            report={finalReport}
            completionReason={completionReason}
            wasAutomatic={wasAutomatic}
            onClose={handleCloseReport}
            isLoading={isGeneratingReport}
            notes={finalReport?.notes || notes}
          />
        )}

        {/* --- POPUP: ОШИБКА / ПРЕРЫВАНИЕ --- */}
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