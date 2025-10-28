import React, { useEffect } from 'react'
import { useInterviewStore } from '../../store/useInterviewStore'
import { VoiceCallPanel } from './VoiceCallPanel'
import { NotesPanel } from './NotesPanel'
import { CodeConsole } from './CodeConsole'
import { InterviewSession } from '../../types/interview'

export const InterviewRoom: React.FC = () => {
  const { currentSession, joinSession } = useInterviewStore()

  useEffect(() => {
    // Эмуляция загрузки сессии с правильными типами
    const mockSession: InterviewSession = {
      id: 'session-1',
      title: 'Frontend Developer Interview',
      position: 'frontend',
      difficulty: 'middle',
      status: 'active',
      createdAt: new Date()
    }

    joinSession(mockSession)
  }, [joinSession])

  if (!currentSession) {
    return <div className="p-8">Загрузка собеседования...</div>
  }

  return (
    <div className="interview-room h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{currentSession.title}</h1>
          <p className="text-gray-400">Позиция: {currentSession.position}</p>
        </div>
        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
          Завершить собеседование
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 h-4/5">
        <div className="col-span-2">
          <VoiceCallPanel />
        </div>

        <div className="col-span-1 flex flex-col gap-4">
          <NotesPanel />
          <CodeConsole />
        </div>
      </div>
    </div>
  )
}