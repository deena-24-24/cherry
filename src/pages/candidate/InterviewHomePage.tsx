import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { ROUTES } from '../../router/routes'
import * as styles from './InterviewHomePage.module.css'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store'
import AiGirl from '../../assets/img.png'

export const InterviewHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  const handleStartInterview = async () => {
    try {
      if (!user) {
        console.error('Пользователь не авторизован, не могу создать сессию интервью')
        return
      }

      const response = await fetch(`${API_URL}/api/interview/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user._id,
          position: 'frontend', // TODO: сделать выбор позиции динамическим
          title: 'AI собеседование',
        }),
      })

      if (!response.ok) {
        console.error('Не удалось создать сессию интервью, статус:', response.status)
        // Фолбэк: поведение как раньше — локальный sessionId
        const fallbackSessionId = `session_${Date.now()}`
        navigate(ROUTES.INTERVIEW_CALL.replace(':sessionId', fallbackSessionId))
        return
      }

      const data = await response.json()
      const sessionId = data.sessionId || data.session?.id

      if (!sessionId) {
        console.error('Сервер не вернул sessionId для созданной сессии')
        const fallbackSessionId = `session_${Date.now()}`
        navigate(ROUTES.INTERVIEW_CALL.replace(':sessionId', fallbackSessionId))
        return
      }

      // Переходим на страницу звонка с ID сессии из мок-БД
      navigate(ROUTES.INTERVIEW_CALL.replace(':sessionId', sessionId))
    } catch (error) {
      console.error('Ошибка при старте интервью:', error)
      const fallbackSessionId = `session_${Date.now()}`
      navigate(ROUTES.INTERVIEW_CALL.replace(':sessionId', fallbackSessionId))
    }
  }

  const handleViewResults = () => {
    navigate(ROUTES.RESULTS)
  }

  return (
    <div className={styles["ihp-wrapper"]}>
      <div className={styles["ihp-container"]}>

        {/* HERO БЛОК → как на макете */}
        <section className={styles["ihp-hero"]}>
          <div className={styles["ihp-hero-text"]}>
            <h2>
              Подготовьтесь к техническому<br />
              интервью с ИИ-собеседующим
            </h2>
            <p>
              Практикуйтесь на реальных вопросах и получайте<br />
              отзыв незамедлительно
            </p>

            {/* ЭТА КНОПКА ПЕРЕВОДИТ НА СТРАНИЦУ ЗВОНКА */}
            <Button className={styles["ihp-hero-btn"]}
              onClick={handleStartInterview}
              styleProps={{ borderColor: '#36447c' }}>
              ПРИСТУПИТЬ К ИНТЕРВЬЮ
            </Button>
          </div>

          <div className={styles["ihp-hero-image"]}>
            <img src={AiGirl}/>
          </div>
        </section>

        {/* Дополнительная информация */}
        <div className={styles["ihp-bottom-info"]}>
          <p>После нажатия кнопки вы попадете в виртуальную комнату собеседования</p>
        </div>

        {/* Карточки фич */}
        <h3 className={styles["ihp-section-title"]}>ВАШИ ИНТЕРВЬЮ</h3>

        <div className={styles["ihp-interview-card"]}>
          <div className={styles["ihp-interview-title"]}>FULLSTACK<br />INTERVIEW</div>

          <div className={styles["ihp-interview-date"]}>
            <span className={styles["ihp-calendar"]}>📅</span> 18/10/2025
          </div>

          <Button className={styles["ihp-interview-btn"]} onClick={handleViewResults}>
            ПОСМОТРЕТЬ ФИДБЕК
          </Button>
        </div>

      </div>
    </div>
  )
}