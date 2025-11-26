// src/pages/candidate/InterviewCallPage.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button'
import { VoiceCallPanel } from '../../components/interview/VoiceCallPanel'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { interviewService } from '../../service/interview/InterviewService'
import { ROUTES } from '../../router/routes'
import { FinalReportPopup } from '../../components/interview/FinalReportPopup'
import { FinalReport, SocketInterviewCompleted } from '../../types'
import { InterviewInterruptedPopup } from '../../components/interview/InterviewInterruptedPopup'


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


  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка собеседования...</div>
  }

  if (error || !currentSession) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
        <p className="text-red-400">{error || 'Сессия не найдена'}</p>
        <Button onClick={() => navigate(ROUTES.HOME)}>Вернуться на главную</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Хедер */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              {currentSession.title}
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full uppercase">
                {currentSession.position}
              </span>
            </h1>
            <p className="text-gray-400 text-sm">Session: {sessionId}</p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleFinishInterview}
              variant="secondary"
              className="px-4 py-2"
            >
              ⏸️ Прервать собеседование
            </Button>
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Основной контент */}
        <div className="flex-1 flex">
          {/* Левая часть - видео плейсхолдеры */}
          <div className="flex-1 bg-black relative flex items-center justify-center p-8">
            <div className="grid grid-cols-2 gap-8 max-w-4xl w-full">
              {/* AI Интервьюер */}
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900 to-purple-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <span className="text-4xl">🤖</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">AI Интервьюер</h3>
                    <div className="mt-2 flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm">Говорит...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Кандидат */}
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <span className="text-4xl">👤</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Вы</h3>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant="secondary"
              className="w-12 h-12 rounded-full"
            >
              📝
            </Button>

            <Button
              onClick={() => setShowConsole(!showConsole)}
              variant="secondary"
              className="w-12 h-12 rounded-full"
            >
              💻
            </Button>
          </div>
        </div>
      </div>

      {/* Боковая панель для заметок и консоли */}
      {(showNotes || showConsole) && (
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => { setShowNotes(true); setShowConsole(false) }}
              className={`flex-1 py-3 text-center ${
                showNotes
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📝 Заметки
            </button>
            <button
              onClick={() => { setShowConsole(true); setShowNotes(false) }}
              className={`flex-1 py-3 text-center ${
                showConsole
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💻 Код
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {showNotes && <NotesPanel />}
            {showConsole && sessionId && <CodeConsole sessionId={sessionId} />}
          </div>
        </div>
      )}
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