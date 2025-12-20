import React, { useEffect, useState } from "react"
import * as styles from "./ProgressContent.module.css"
import { useAuthStore } from "../../../store"
import { fetchMyResumes } from "../../../service/api/resumeService"
import { interviewService } from '../../../service/api/interviewService'
import { Resume } from "../../../types/resume"
import { InterviewSession } from "../../../types"

export const ProgressContent: React.FC = () => {
  const { user } = useAuthStore()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!user?._id) return
      try {
        const [resumesData, sessionsData] = await Promise.all([
          fetchMyResumes(),
          interviewService.fetchUserSessions(user._id)
        ])
        setResumes(resumesData)
        setSessions(sessionsData)
      } catch (error) {
        console.error("Error loading progress data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user?._id])

  if (loading) return <div>Загрузка прогресса...</div>

  // Если нет резюме, показываем заглушку
  if (resumes.length === 0) {
    return <div>У вас пока нет пройденных собеседований. Пройдите интервью, чтобы отслеживать прогресс.</div>
  }

  return (
    <div className={styles["progressContainer"]}>
      {resumes.map((resume) => {
        // Фильтруем сессии для текущей позиции из резюме
        const positionSessions = sessions.filter(
          s => s.position?.toLowerCase() === resume.position.toLowerCase() ||
            s.position?.toLowerCase() === resume.title.toLowerCase()
        )

        const totalInterviews = positionSessions.length
        const completedInterviews = positionSessions.filter(s => s.status === 'completed').length

        // Фильтруем только те сессии, где есть финальная оценка
        const completedWithScore = positionSessions.filter(s =>
          typeof s.finalReport?.overall_assessment?.final_score === 'number'
        )

        // Считаем сумму безопасно
        const totalScore = completedWithScore.reduce((acc, s) =>
          acc + (s.finalReport?.overall_assessment?.final_score ?? 0), 0
        )

        // Расчет среднего балла
        const averageScore = completedWithScore.length > 0
          ? (totalScore / completedWithScore.length).toFixed(1)
          : "0.0"

        return (
          <div key={resume.id} className={styles["positionGroup"]}>
            <div className={styles["positionTitle"]}>
              {resume.position} <span style={{ fontSize: '0.6em', color: '#666' }}>({resume.title})</span>
            </div>

            {/* Блок "ИИ-Собеседований" для этой позиции */}
            <div className={styles["interviewsBlock"]}>

              {/* Левая карточка: Статистика */}
              <div className={styles["interviewCardLeft"]}>
                <div className={styles["cardTitle"]}>ИИ-Собеседований</div>

                <div className={styles["statRow"]}>
                  <span className={styles["statLabel"]}>Всего</span>
                  <span className={styles["statValue"]}>{totalInterviews}</span>
                </div>

                <div className={styles["statRow"]}>
                  <span className={styles["statLabel"]}>Успешно</span>
                  <span className={styles["statValue"]}>{completedInterviews}</span>
                </div>
              </div>

              {/* Правая карточка: Средний балл */}
              <div className={styles["interviewCardRight"]}>
                <div className={styles["scoreTitle"]}>Средний балл</div>
                <div className={styles["scoreValue"]}>{averageScore}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>/ 10</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}