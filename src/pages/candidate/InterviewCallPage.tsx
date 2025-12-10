// src/pages/candidate/InterviewCallPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button/Button'
import { VoiceCallPanel } from '../../components/interview/VoiceCallPanel'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { interviewService } from '../../service/interview/InterviewService'
import { ROUTES } from '../../router/routes'
import { FinalReportPopup } from '../../components/interview/FinalReportPopup'
import { FinalReport, SocketInterviewCompleted } from '../../types'
import { InterviewInterruptedPopup } from '../../components/interview/InterviewInterruptedPopup'
import './InterviewCallPage.css'

export const InterviewCallPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { currentSession, isLoading, error, fetchSession, endCall } = useInterviewStore()

  // Локальное состояние только для UI контролов
  const [showNotes, setShowNotes] = useState(false)
  const [showConsole, setShowConsole] = useState(false)

  // ДОБАВЛЯЕМ СОСТОЯНИЯ ДЛЯ ФИНАЛЬНОГО ОТЧЕТА
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)
  const [completionReason, setCompletionReason] = useState<string>('')
  const [wasAutomatic, setWasAutomatic] = useState<boolean>(false)
  const [showInterrupted, setShowInterrupted] = useState(false)
  const [interruptionReason, setInterruptionReason] = useState<string>('')

  useEffect(() => {
    const idToFetch = sessionId || 'session_1'
    fetchSession(idToFetch)
  }, [sessionId, fetchSession])

  // Строго типизированный обработчик завершения
  const handleInterviewCompleted = useCallback((data: SocketInterviewCompleted) => {
    console.log('🏁 Interview completed received:', data)

    if (data.wasAutomatic) {
      setFinalReport(data.finalReport)
      setCompletionReason(data.completionReason)
      setWasAutomatic(true)
      setShowFinalReport(true)
    }

    endCall()
  }, [endCall])

  useEffect(() => {
    interviewService.onInterviewCompleted(handleInterviewCompleted)

    return () => {
      interviewService.offInterviewCompleted(handleInterviewCompleted)
    }
  }, [handleInterviewCompleted])

  const handleManualInterruption = useCallback(async (reason: string = 'Ручное прерывание') => {
    if (!currentSession) return

    try {
      console.log('🛑 Manually interrupting interview...')
      await interviewService.endInterview()
      setInterruptionReason(reason)
      setShowInterrupted(true)
    } catch (error) {
      console.error('Failed to interrupt interview', error)
      setInterruptionReason(`${reason} (с ошибкой)`)
      setShowInterrupted(true)
    }
  }, [currentSession])

  const handleEndCallFromPanel = useCallback(() => {
    console.log('📞 End call requested from VoiceCallPanel')
    handleManualInterruption('Собеседование прервано пользователем')
  }, [handleManualInterruption])

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

  const handleFinishInterview = useCallback(() => {
    handleManualInterruption('Собеседование прервано')
  }, [handleManualInterruption])

  const closeSidePanels = () => {
    setShowNotes(false)
    setShowConsole(false)
  }

  if (isLoading) {
    return <div className="loading-screen">Загрузка собеседования...</div>
  }

  if (error || !currentSession) {
    return (
      <div className="loading-screen">
        <p className="text-red-400">{error || 'Сессия не найдена'}</p>
        <Button onClick={() => navigate(ROUTES.HOME)} className="back-btn">
          Вернуться на главную
        </Button>
      </div>
    )
  }

  return (
    <div className="call-page">
      {/* Основная область */}
      <div className="call-header">
        {/* Хедер */}

        <div className="header-right">
          <div className="session-info">
            <h1>{currentSession.title}</h1>
            <span className="session-label">{currentSession.position}</span>
          </div>
          <div className="connection">
            <div className="dot"></div>
            Connected
          </div>
          <Button className="interrupt-btn" variant="secondary" onClick={handleEndCallFromPanel}>
            ⏸️ Прервать собеседование
          </Button>
        </div>

        {/* Основной контент */}
        <div className="interview-main">

          <div className="ai-block block">
            <h2>ИИ-СОБЕСЕДУЮЩИЙ</h2>
            <div className="avatar">
              <span className="avatar-icon">🤖</span>
            </div>
            <div className="talking-row">
              <div className="talking-dot"></div>
              <span className="talking-text">Говорит...</span>
            </div>
          </div>

          <div className="user-block block">
            <h2>КАНДИДАТ</h2>
            <div className="avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <p className="subtitle">Вы</p>
          </div>


          {/* Правая часть - голосовая панель */}
          <div className="w-1/3 bg-gray-800 border-l border-gray-700">
            <VoiceCallPanel
              sessionId={currentSession.id}
              position={currentSession.position}
            />
          </div>
        </div>

        {/* Нижняя панель управления */}
        <div className="bottom-controls">
          <Button
            className="round-btn"
            variant={"secondary"}
            onClick={() => setShowNotes(!showNotes)}
          >
            📝
          </Button>
          <Button
            className="round-btn"
            variant="secondary"
            onClick={() => setShowConsole(!showConsole)}
          >
            💻
          </Button>
        </div>
      </div>

      {/* Боковая панель для заметок и консоли */}
      <div className={`side-overlay ${showNotes || showConsole ? 'open' : ''}`} onClick={closeSidePanels}>
        <aside className={`side-panel ${showNotes || showConsole ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="tabs">
            <button
              onClick={() => { setShowNotes(true); setShowConsole(false) }}
              className={`tab ${showNotes? 'active': ''}`}>
              📝 Заметки
            </button>
            <button
              onClick={() => { setShowConsole(true); setShowNotes(false) }}
              className={`tab ${showConsole ? 'active' : ''}`} >
              💻 Код
            </button>
          </div>

          <div className="panel-content">
            {showNotes && <NotesPanel />}
            {showConsole && sessionId && <CodeConsole sessionId={sessionId} />}
          </div>
        </aside>
      </div>


      {showFinalReport && (
        <FinalReportPopup
          report={finalReport}
          completionReason={completionReason}
          wasAutomatic={wasAutomatic}
          onClose={handleCloseReport}
        />
      )}

      {/* Попап для прерванного собеседования */}
      {showInterrupted && (
        <InterviewInterruptedPopup
          reason={interruptionReason}
          onClose={handleCloseInterruption}
        />
      )}
    </div>
  )
}