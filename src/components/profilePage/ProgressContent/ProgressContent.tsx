import React, { useEffect, useState } from "react"
import * as styles from "./ProgressContent.module.css"
import { useAuthStore } from "../../../store"
import { fetchMyResumes } from "../../../service/api/resumeService"
import { interviewService } from '../../../service/api/interviewService'
import { Resume } from "../../../types/resume"
import { InterviewSession } from "../../../types"
import { SmallLoader } from '../../ui/Loader/SmallLoader'

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

  if (loading) {
    return <SmallLoader />
  }

  // Если нет резюме, показываем заглушку
  if (resumes.length === 0) {
    return (
      <div className={styles['noProgress']}>
        <p>У вас пока нет пройденных собеседований. Пройдите интервью, чтобы отслеживать прогресс.</p>
      </div>
    )
  }

  // Если есть сессии, но нет резюме - показываем все сессии
  const allSessionsWithScore = sessions.filter(s =>
    typeof s.finalReport?.overall_assessment?.final_score === 'number'
  )

  // Если нет резюме, но есть сессии с оценками - показываем их
  if (resumes.length === 0 && allSessionsWithScore.length > 0) {
    const totalInterviews = allSessionsWithScore.length
    const successfulInterviews = allSessionsWithScore.filter(s => {
      const score = s.finalReport?.overall_assessment?.final_score ?? 0
      return score >= 5
    }).length
    const totalScore = allSessionsWithScore.reduce((acc, s) => {
      const score = s.finalReport?.overall_assessment?.final_score ?? 0
      return acc + score
    }, 0)
    const averageScore = allSessionsWithScore.length > 0
      ? (totalScore / allSessionsWithScore.length).toFixed(1)
      : "0.0"
    
    return (
      <div className={styles["progressContainer"]}>
        <div className={styles["positionGroup"]}>
          <div className={styles["positionTitle"]}>
            Все интервью
          </div>
          <div className={styles["interviewsBlock"]}>
            <div className={styles["interviewCardLeft"]}>
              <div className={styles["cardTitle"]}>ИИ-Собеседований</div>
              <div className={styles["statRow"]}>
                <span className={styles["statLabel"]}>Всего</span>
                <span className={styles["statValue"]}>{totalInterviews}</span>
              </div>
              <div className={styles["statRow"]}>
                <span className={styles["statLabel"]}>Успешно</span>
                <span className={styles["statValue"]}>{successfulInterviews}</span>
              </div>
            </div>
            <div className={styles["interviewCardRight"]}>
              <div className={styles["scoreTitle"]}>Средний балл</div>
              <div className={styles["scoreValue"]}>{averageScore}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>/ 10</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles["progressContainer"]}>
      {resumes.map((resume) => {
        // Фильтруем сессии для текущей позиции из резюме (более гибкая фильтрация)
        const positionSessions = sessions.filter(s => {
          const sessionPosition = s.position?.toLowerCase() || ''
          const resumePosition = resume.position?.toLowerCase() || ''
          const resumeTitle = resume.title?.toLowerCase() || ''
          
          return sessionPosition === resumePosition ||
            sessionPosition === resumeTitle ||
            sessionPosition.includes(resumePosition) ||
            resumePosition.includes(sessionPosition)
        })

        // Фильтруем только те сессии, где есть финальная оценка из фидбека
        const sessionsWithScore = positionSessions.filter(s =>
          typeof s.finalReport?.overall_assessment?.final_score === 'number'
        )

        // Количество интервью = количество сессий с финальной оценкой
        const totalInterviews = sessionsWithScore.length

        // Успешные интервью = те, где балл >= 5/10
        const successfulInterviews = sessionsWithScore.filter(s => {
          const score = s.finalReport?.overall_assessment?.final_score ?? 0
          return score >= 5
        }).length

        // Считаем сумму баллов из фидбека
        const totalScore = sessionsWithScore.reduce((acc, s) => {
          const score = s.finalReport?.overall_assessment?.final_score ?? 0
          return acc + score
        }, 0)

        // Расчет среднего балла из фидбека
        const averageScore = sessionsWithScore.length > 0
          ? (totalScore / sessionsWithScore.length).toFixed(1)
          : "0.0"
        
        // Показываем только если есть интервью для этой позиции
        if (totalInterviews === 0) return null

        return (
          <div key={resume.id} className={styles["positionGroup"]}>
            <div className={styles["positionTitle"]}>
              {resume.position}
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
                  <span className={styles["statValue"]}>{successfulInterviews}</span>
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