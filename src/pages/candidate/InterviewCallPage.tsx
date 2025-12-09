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

  // Управление UI элементами
  const [showNotes, setShowNotes] = useState(false)
  const [showConsole, setShowConsole] = useState(false)

  // Состояния для финального отчета
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null)
  const [completionReason, setCompletionReason] = useState<string>('')
  const [wasAutomatic, setWasAutomatic] = useState<boolean>(false)

  // Состояния для прерванного интервью
  const [showInterrupted, setShowInterrupted] = useState(false)
  const [interruptionReason, setInterruptionReason] = useState<string>('')

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
          // Ошибка уже обработана в store, но можно добавить дополнительную логику
        }
      }
    }

    void loadSession()

    return () => {
      controller.abort() // Отмена при размонтировании
    }
  }, [sessionId, fetchSession])

  // Строго типизированный обработчик завершения интервью через WebSocket
  const handleInterviewCompleted = useCallback((data: SocketInterviewCompleted) => {
    console.log('🏁 Interview completed received:', data)

    // ЛОГИРОВАНИЕ ДЛЯ ДИАГНОСТИКИ
    console.log('📊 Final report structure:', {
      hasReport: !!data.finalReport,
      hasOverallAssessment: !!data.finalReport?.overall_assessment,
      overallAssessment: data.finalReport?.overall_assessment,
      wasAutomatic: data.wasAutomatic
    })

    if (data.wasAutomatic) {
      setFinalReport(data.finalReport)
      setCompletionReason(data.completionReason)

      setShowFinalReport(true)
      setWasAutomatic(true)
    }

    endCall()
  }, [endCall])

  useEffect(() => {
    interviewService.onInterviewCompleted(handleInterviewCompleted)

    return () => {
      interviewService.offInterviewCompleted(handleInterviewCompleted)
    }
  }, [handleInterviewCompleted])

  //test
  const handleTestPopup = () => {
    console.log('🧪 Test button clicked')

    const mockReport: FinalReport = {
      overall_assessment: {
        final_score: 7.5,
        level: "Middle",
        recommendation: "hire",
        confidence: 0.8,
        strengths: [
          { strength: "Хорошие базовые знания JavaScript", frequency: 3, confidence: 0.9 },
          { strength: "Логическое мышление", frequency: 2, confidence: 0.8 }
        ],
        improvements: ["Нужно углубить знания архитектуры", "Практиковать алгоритмы"],
        potential_areas: [
          {
            topic: "System Design",
            reason: "Хорошие базовые знания, но требуется углубление",
            potential: "high"
          }
        ]
      },
      technical_skills: {
        topics_covered: ["JavaScript", "React", "HTML/CSS", "TypeScript"],
        strong_areas: ["Frontend development", "React components"],
        weak_areas: ["System design", "Performance optimization"],
        technical_depth: 7.2,
        recommendations: ["Изучить продвинутые паттерны", "Практиковать алгоритмы"]
      },
      behavioral_analysis: {
        communication_skills: {
          score: 8.0,
          structure: 7.5,
          clarity: 8.5,
          feedback: "Отличные коммуникативные навыки, ясное изложение мыслей"
        },
        problem_solving: {
          score: 7.0,
          examples_count: 2,
          feedback: "Способен решать типовые задачи, требуется практика с сложными кейсами"
        },
        learning_ability: {
          score: 8.5,
          topics_mastered: 4,
          feedback: "Быстро осваивает новые темы, показывает хороший прогресс"
        },
        adaptability: {
          score: 7.8,
          consistency: 8.0,
          trend: 0.5,
          feedback: "Хорошо адаптируется к новым вопросам, демонстрирует стабильность"
        }
      },
      interview_analytics: {
        total_duration: "18 минут",
        total_questions: 12,
        topics_covered_count: 5,
        average_response_quality: 7.5,
        topic_progression: ["введение", "javascript", "react", "оптимизация"],
        action_pattern: {
          total_actions: 15,
          action_breakdown: {
            "continue_topic": 8,
            "next_topic": 4,
            "deep_dive_topic": 3
          },
          most_common_action: "continue_topic",
          completion_rate: "completed"
        }
      },
      detailed_feedback: "Кандидат демонстрирует хороший потенциал для позиции Middle Frontend-разработчика. Показал уверенные знания базовых технологий и способность к обучению. Рекомендуется углубление в архитектурные вопросы и оптимизацию производительности.",
      next_steps: [
        "Техническое интервью с лидом",
        "Оценка культурного соответствия команде",
        "Обсуждение плана развития на первые 3 месяца"
      ],
      raw_data: {
        evaluationHistory: [],
        actionsHistory: []
      }
    }

    setFinalReport(mockReport)
    setCompletionReason("Тестовое завершение собеседования")
    setShowFinalReport(true)
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

          <button
            onClick={handleTestPopup}
            className="fixed top-4 right-4 bg-green-500 text-white p-2 rounded z-50"
          >
            TEST POPUP
          </button>

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

      {/* для прерванного собеседования */}
      {showInterrupted && (
        <InterviewInterruptedPopup
          reason={interruptionReason}
          onClose={handleCloseInterruption}
        />
      )}
    </div>
  )
}