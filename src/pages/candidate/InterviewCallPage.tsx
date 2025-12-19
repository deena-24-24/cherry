import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button/Button'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { ROUTES } from '../../router/routes'
import { FinalReportPopup } from '../../components/interview/FinalReportPopup'
import { FinalReport, SocketInterviewCompleted } from '../../types'
import { InterviewInterruptedPopup } from '../../components/interview/InterviewInterruptedPopup'
import { useVoiceCall } from '../hooks/useVoiceCall'
import { saluteFrontendService } from '../../service/api/saluteFrontendService'
import { socketService } from '../../service/realtime/socketService'
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

  // === СОСТОЯНИЯ ===
  const [showNotes, setShowNotes] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)
  const [completionReason, setCompletionReason] = useState<string>('')
  const [wasAutomatic, setWasAutomatic] = useState<boolean>(false)
  const [showInterrupted, setShowInterrupted] = useState(false)
  const [interruptionReason, setInterruptionReason] = useState<string>('')
  const [isFinishing, setIsFinishing] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const reportTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [connectionQuality, setConnectionQuality] = useState<'good' | 'average' | 'poor'>('good')
  const [voiceActivity, setVoiceActivity] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [interviewPosition, setInterviewPosition] = useState<string | null>(null)

  useEffect(() => {
    if (showConsole || showNotes) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showConsole, showNotes])

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

  useEffect(() => {
    socketService.onCompletionStarted(() => {
      setIsGeneratingReport(true)
      saluteFrontendService.stopAudio()
    })
    return () => socketService.offCompletionStarted()
  }, [])

  const handleInterviewCompleted = useCallback((data: SocketInterviewCompleted) => {
    if (reportTimeoutRef.current) {
      clearTimeout(reportTimeoutRef.current)
      reportTimeoutRef.current = null
    }

    setIsGeneratingReport(false)

    if (data.finalReport) {
      setFinalReport(data.finalReport)
      setCompletionReason(data.completionReason || 'Собеседование завершено')
      setWasAutomatic(data.wasAutomatic || false)
      setShowInterrupted(false)
      setShowFinalReport(true)
    } else {
      setInterruptionReason(data.completionReason || 'Собеседование завершено без отчета')
      setShowInterrupted(true)
    }

    socketService.disconnect()
    endStoreCall()
    setIsFinishing(false)
  }, [endStoreCall])

  useLayoutEffect(() => {
    socketService.onInterviewCompleted(handleInterviewCompleted)
    return () => {
      socketService.offInterviewCompleted()
    }
  }, [handleInterviewCompleted])

  const shouldInitVoice = !!sessionId && !!interviewPosition

  const {
    isRecording,
    isAIThinking,
    isAISpeaking,
    isMicrophoneBlocked,
    toggleRecording,
    transcript,
    aiResponse,
    error: voiceError
  } = useVoiceCall(
    shouldInitVoice ? sessionId : '',
    shouldInitVoice ? interviewPosition! : ''
  )

  useEffect(() => {
    if (!isCallActive) startStoreCall()
  }, [isCallActive, startStoreCall])

  useEffect(() => {
    const checkConnection = () => {
      const state = socketService.getConnectionState?.() || 'disconnected'
      setIsConnected(state === 'connected')
    }
    const interval = setInterval(checkConnection, 2000)
    checkConnection()
    return () => clearInterval(interval)
  }, [])

  const getMicButtonText = () => {
    if (isRecording) return 'Остановить и отправить'
    if (isAIThinking) return 'ИИ думает...'
    if (isAISpeaking) return 'ИИ говорит...'
    return 'Включить микрофон'
  }

  const getMicButtonStyle = () => {
    if (isRecording) return styles['mic-recording']
    if (isMicrophoneBlocked) return styles['mic-disabled']
    return styles['mic']
  }

  useEffect(() => {
    if (!isCallActive) return
    const interval = setInterval(() => {
      const qualities: Array<'good' | 'average' | 'poor'> = ['good', 'average', 'poor']
      setConnectionQuality(qualities[Math.floor(Math.random() * qualities.length)])
    }, 5000)
    return () => clearInterval(interval)
  }, [isCallActive])

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
  }, [isRecording, transcript, isCallActive])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCallActive) {
        handleEndCall('user').then()
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isCallActive])

  const handleEndCall = useCallback(async (reason: 'user' | 'system' | 'error' = 'user') => {
    if (!isCallActive || isFinishing) return

    setIsFinishing(true)
    setIsGeneratingReport(true)

    if (isRecording) toggleRecording()
    saluteFrontendService.stopAudio()

    try {
      socketService.sendCompleteInterview(sessionId || '')
      reportTimeoutRef.current = setTimeout(() => {
        if (!showFinalReport) {
          setInterruptionReason('Сервер долго формирует отчет. Попробуйте проверить результаты в личном кабинете.')
          setShowInterrupted(true)
          setIsFinishing(false)
        }
      }, 15000)
    } catch (error) {
      console.error('Error ending call:', error)
      setIsFinishing(false)
      setIsGeneratingReport(false)
    }
  }, [isCallActive, isFinishing, isRecording, toggleRecording, sessionId, showFinalReport])


  const handleCloseReport = useCallback(() => {
    console.log("🚀 Закрытие отчета и переход на Interview Home")
    setShowFinalReport(false)
    setFinalReport(null)
    navigate(ROUTES.INTERVIEW_HOME)
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

  if (isLoading || !currentSession || !interviewPosition) {
    return <div className={styles['loading-screen']}>Загрузка собеседования...</div>
  }

  if (error) return <div className={styles['loading-screen']}><p className="text-red-400">{error}</p><Button onClick={() => navigate(ROUTES.HOME)} className={styles['back-btn']}>Вернуться на главную</Button></div>

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
          <div className={`${styles['block']} ${styles['ai-block']}`}>
            <h2>ИИ-СОБЕСЕДУЮЩИЙ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>🤖</span>
            </div>
          </div>

          <div className={`${styles['block']} ${styles['user-block']}`}>
            <h2>КАНДИДАТ</h2>
            <div className={styles['avatar']}>
              <span className={styles['avatar-icon']}>👤</span>
            </div>
            <p className={styles['subtitle']}>Вы</p>
          </div>

          <aside className={styles["panel"]}>
            <header className={styles['header']}>
              <span className={styles['status']}>
                <i className={isConnected ? styles['online'] : styles['offline']} />
                {isConnected ? <div className={styles['connection']}><div className={styles['dot']}></div>Подключено</div> : 'Нет подключения'}
              </span>
              {(isAISpeaking || isAIThinking) && (
                <span className={styles['aiLive']}>
                  {isAIThinking ? '⚡ Генерирует ответ...' : '🔊 Озвучивает...'}
                </span>
              )}
            </header>

            <div className={styles['ai']}>
              {/* Если ИИ думает, можно показать скелетон или лоадер */}
              {isAIThinking && !aiResponse && <div className="text-gray-400 text-sm animate-pulse">Печатает...</div>}
              {aiResponse && <div className={styles['subtitle']}>“{aiResponse}”</div>}
            </div>

            <div className={styles['user']}>
              <div className={styles['userLabel']}>🎤 Вы {isRecording && <span className={styles['recording']} />}</div>
              <div className={styles['transcript']}>
                {transcript || (isRecording ? 'Слушаю вас...' : 'Нажмите микрофон и говорите...')}
              </div>
            </div>

            <footer className={styles['bottom-controls']}>
              <Button className={styles['round-btn']} variant={"secondary"} onClick={() => setShowNotes(!showNotes)}>📝</Button>
              <Button className={styles['round-btn']} variant="secondary" onClick={() => setShowConsole(!showConsole)}>💻</Button>
              <button
                className={`${styles['mic']} ${isMicrophoneBlocked ? 'opacity-50 cursor-not-allowed bg-gray-600' : ''}`}
                onClick={toggleRecording}
                disabled={isMicrophoneBlocked} // Физическая блокировка
                style={{
                  backgroundColor: isRecording ? '#ff3b3b' : (isMicrophoneBlocked ? '#4b5563' : '#2a2f3a'),
                  cursor: isMicrophoneBlocked ? 'not-allowed' : 'pointer'
                }}
              >
                {getMicButtonText()}
              </button>

              <button className={styles['end']} onClick={() => handleEndCall('user')}>Завершить собеседование</button>
            </footer>
          </aside>
        </div>

        <div className={`${styles['side-overlay']} ${showNotes || showConsole ? styles['open'] : ''}`} onClick={closeSidePanels}>
          <aside className={`${styles['side-panel']} ${showNotes || showConsole ? styles['open'] : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles['tabs']}>
              <button onClick={() => { setShowNotes(true); setShowConsole(false) }} className={`${styles["tab"]} ${showNotes? styles['active'] : ''}`}>📝 Заметки</button>
              <button onClick={() => { setShowConsole(true); setShowNotes(false) }} className={`${styles['tab']} ${showConsole ? styles['active'] : ''}`} >💻 Код</button>
            </div>
            <div className={styles['panel-content']}>
              {showNotes && <NotesPanel />}
              {showConsole && sessionId && <CodeConsole sessionId={sessionId} />}
            </div>
          </aside>
        </div>

        {isGeneratingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[2000]">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center border border-gray-700">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Генерация фидбэка</h3>
              <p className="text-gray-400">ИИ анализирует ваши ответы и составляет отчет. Это может занять до минуты...</p>
            </div>
          </div>
        )}

        {showFinalReport && <FinalReportPopup report={finalReport} completionReason={completionReason} wasAutomatic={wasAutomatic} onClose={handleCloseReport} />}
        {showInterrupted && <InterviewInterruptedPopup reason={interruptionReason} onClose={handleCloseInterruption} />}
      </div>
    </div>
  )
}