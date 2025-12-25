import React, { useEffect, useMemo, useState } from 'react'
import * as styles from './InterviewResultsPage.module.css'
import { useAuthStore } from '../../store'
import { API_URL } from '../../config'
import { FinalReport, InterviewSession } from '../../types'
import { Button } from '../../components/ui/Button/Button'
import { FinalReportPopup } from '../../components/popup/FinalReportPopup'
import { Loader } from '../../components/ui/Loader/Loader'

interface SessionWithReport extends InterviewSession {
  completedAt?: string
  finalReport?: FinalReport
}

export const InterviewResultsPage: React.FC = () => {
  const { user, token } = useAuthStore()
  const [sessions, setSessions] = useState<SessionWithReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<FinalReport | null>(null)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_URL}/api/interview/users/${user._id}/sessions`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        })

        if (!response.ok) {
          throw new Error(`Ошибка загрузки сессий: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setSessions(data.sessions || [])
        } else {
          setError(data.error || 'Не удалось загрузить сессии')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить сессии')
      } finally {
        setLoading(false)
      }
    }

    void fetchSessions()
  }, [user, token])

  const sortedSessions = useMemo(
    () => sessions.slice().sort((a, b) =>
      new Date(b.completedAt || b.createdAt as unknown as string).getTime() -
      new Date(a.completedAt || a.createdAt as unknown as string).getTime()
    ),
    [sessions]
  )

  const latestSession = sortedSessions[0]

  const handleOpenReport = async (sessionId: string) => {
    try {
      setError(null)
      const response = await fetch(`${API_URL}/api/interview/sessions/${sessionId}/report`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить финальный отчет')
      }

      const data = await response.json()
      if (data.success && data.report) {
        setSelectedReport(data.report)
        setShowReport(true)
      } else {
        throw new Error(data.error || 'Отчет не найден')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить отчет')
    }
  }

  const handleCloseReport = () => {
    setShowReport(false)
    setSelectedReport(null)
  }

  if (!user) {
    return (
      <div className={styles['irp-wrapper']}>
        <div className={styles['irp-container']}>
          <h2 className={styles['irp-title']}>Ваши интервью</h2>
          <p className={styles['irp-subtitle']}>Авторизуйтесь, чтобы увидеть историю интервью.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles['irp-wrapper']}>
      <div className={styles['irp-container']}>
        <h2 className={styles['irp-title']}>Ваши интервью</h2>
        <p className={styles['irp-subtitle']}>
          Здесь сохраняется результат последнего интервью с ИИ-собеседующим и краткая история сессий.
        </p>

        {error && (
          <div className={styles['irp-error']}>
            {error}
          </div>
        )}

        <section className={styles['irp-latest-block']}>
          <h3 className={styles['irp-section-title']}>Последнее интервью</h3>

          {loading ? (
            <Loader />
          ) : !latestSession ? (
            <div className={styles['irp-empty']}>
              У вас еще нет сохраненных интервью. Начните первое собеседование на главной странице.
            </div>
          ) : (
            <div className={styles['irp-card']}>
              <div className={styles['irp-card-main']}>
                <div className={styles['irp-card-title']}>
                  {latestSession.title}
                </div>
                <div className={styles['irp-card-meta']}>
                  <span className={styles['irp-pill']}>
                    {latestSession.position}
                  </span>
                  <span className={styles['irp-pill']}>
                    {latestSession.status === 'completed' ? 'Завершено' : 'В процессе'}
                  </span>
                  <span>
                    📅 {new Date(latestSession.completedAt || latestSession.createdAt as unknown as string).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>

              <div className={styles['irp-score-block']}>
                {latestSession.finalReport?.overall_assessment?.final_score ? (
                  <>
                    <div className={styles['irp-score']}>
                      {latestSession.finalReport.overall_assessment.final_score.toFixed(1)}/10
                    </div>
                    <div className={styles['irp-score-label']}>
                      {latestSession.finalReport.overall_assessment.level}
                    </div>
                  </>
                ) : (
                  <div className={styles['irp-score-label']}>
                    Отчет будет доступен после завершения интервью
                  </div>
                )}

                <Button
                  className="mt-3"
                  onClick={() => handleOpenReport(latestSession.id)}
                  styleProps={{ textColor: '#fffcf5' }}
                >
                  Посмотреть финальный отчет
                </Button>
              </div>
            </div>
          )}
        </section>

        {sortedSessions.length > 1 && (
          <section>
            <h3 className={styles['irp-section-title']}>История интервью</h3>
            <div className={styles['irp-history-list']}>
              {sortedSessions.map((session) => (
                <div key={session.id} className={styles['irp-history-item']}>
                  <div>
                    <div className={styles['irp-history-title']}>{session.title}</div>
                    <div className={styles['irp-history-meta']}>
                      <span>{session.position}</span>
                      <span>·</span>
                      <span>
                        {new Date(session.completedAt || session.createdAt as unknown as string)
                          .toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenReport(session.id)}
                  >
                    Отчет
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showReport && selectedReport && (
        <FinalReportPopup
          report={selectedReport}
          completionReason="Сохраненный отчет по интервью"
          wasAutomatic={true}
          onClose={handleCloseReport}
        />
      )}
    </div>
  )
}


