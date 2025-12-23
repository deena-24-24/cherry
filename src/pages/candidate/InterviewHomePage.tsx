import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { ROUTES } from '../../router/routes'
import * as styles from './InterviewHomePage.module.css'
import { API_URL } from '../../config'
import { useAuthStore } from '../../store'
import AiGirl from '../../assets/img.png'
import { PositionSelectPopup, InterviewPosition } from '../../components/popup/PositionSelectPopup'

export const InterviewHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [showPositionPopup, setShowPositionPopup] = useState(false)

  const handleStartInterview = () => {
    // Показываем попап выбора позиции
    setShowPositionPopup(true)
  }

  const handlePositionSelect = async (position: InterviewPosition) => {
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
          position: position,
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

        {/* Карточки фич */}
        <h3 className={styles["ihp-section-title"]}>ПРОЙДЕННЫЕ ИНТЕРВЬЮ</h3>

        <div className={styles["ihp-interview-card"]}>
          <div className={styles["ihp-interview-title"]}>Отчёты по прошлым интервью</div>

          <div className={styles["ihp-interview-date"]}>
            <span className={styles['ihp-calendar']}>Здесь вы можете просмотреть фидбек по пройденными Вами интервью</span>
          </div>

          <Button className={styles["ihp-interview-btn"]} onClick={handleViewResults}>
            ПОСМОТРЕТЬ ФИДБЕК
          </Button>
        </div>

      </div>

      {/* Попап выбора направления собеседования */}
      <PositionSelectPopup
        isOpen={showPositionPopup}
        onClose={() => setShowPositionPopup(false)}
        onSelect={handlePositionSelect}
      />
    </div>
  )
}