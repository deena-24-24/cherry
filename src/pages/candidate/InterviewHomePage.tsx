import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button/Button'
import { ROUTES } from '../../router/routes'
import * as styles from './InterviewHomePage.module.css'
import AiGirl from '../../assets/img.png'

export const InterviewHomePage: React.FC = () => {
  const navigate = useNavigate()

  const handleStartInterview = () => {
    const sessionId = `session_${Date.now()}`
    // Переходим на страницу звонка
    navigate(ROUTES.INTERVIEW_CALL.replace(':sessionId', sessionId))
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
            <Button className={styles["ihp-hero-btn"]} onClick={handleStartInterview}>
              ПРИСТУПИТЬ К ИНТЕРВЬЮ
            </Button>
          </div>

          <div className={styles["ihp-hero-image"]}>
            {/* todo: Добавить ссылку */}
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

          <button className={styles["ihp-interview-btn"]} onClick={handleViewResults}>
            ПОСМОТРЕТЬ ФИДБЕК
          </button>
        </div>

      </div>
    </div>
  )
}