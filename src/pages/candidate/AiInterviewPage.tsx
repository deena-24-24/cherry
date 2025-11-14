import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../../store'
import { Button } from '../../components/ui/Button'
import { VoiceCallPanel } from '../../components/interview/VoiceCallPanel'
import { NotesPanel } from '../../components/interview/NotesPanel'
import { CodeConsole } from '../../components/interview/CodeConsole'
import { ROUTES } from '../../router/routes'
import { API_URL } from '../../config'

export const AiInterviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { currentSession, isLoading, error, fetchSession, endCall } = useInterviewStore()

  useEffect(() => {
    const idToFetch = sessionId || 'session_1'
    fetchSession(idToFetch)

    return () => {
      endCall() // Очистка при размонтировании компонента
    }
  }, [sessionId, fetchSession, endCall])

  const handleFinishInterview = async () => {
    if (!currentSession) return
    try {
      await fetch(`${API_URL}/api/interview/sessions/${currentSession.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      navigate(ROUTES.HOME) // Или на страницу результатов
    } catch (e) {
      console.error('Failed to complete interview', e)
    }
  }

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
    <div className="interview-room h-[calc(100vh-64px)] bg-gray-950 text-white p-4 overflow-hidden flex flex-col">
      <header className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {currentSession.title}
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full uppercase">
              {currentSession.position}
            </span>
          </h1>
        </div>
        <Button
          onClick={handleFinishInterview}
        >
          Завершить собеседование
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 h-full">
          <VoiceCallPanel sessionId={currentSession.id} position={currentSession.position} />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 h-full min-h-0">
          <div className="h-1/3 min-h-[200px]">
            <NotesPanel />
          </div>
          <div className="flex-1 min-h-0">
            {/* Передаем sessionId в CodeConsole */}
            <CodeConsole sessionId={currentSession.id} />
          </div>
        </div>
      </div>
    </div>
  )
}