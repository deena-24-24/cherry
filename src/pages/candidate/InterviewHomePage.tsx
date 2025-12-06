import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Header } from '../../components/layout/Header'
import { ROUTES } from '../../router/routes'
import './InterviewHomePage.css'

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
    <div className="ihp-wrapper">
      <div className="ihp-container">
        {/* Хедер
        <header className="ihp-header">
          <h1>
            AI Interview Assistant
          </h1>
          <p>
            Подготовьтесь к собеседованию с искусственным интеллектом
          </p>
        </header> */}

        {/* HERO БЛОК → как на макете */}
        <section className="ihp-hero">
          <div className="ihp-hero-text">
            <h2>
              Подготовьтесь к техническому<br />
              интервью с ИИ-собеседующим
            </h2>
            <p>
              Практикуйтесь на реальных вопросах и получайте<br />
              отзыв незамедлительно
            </p>

            {/* ЭТА КНОПКА ПЕРЕВОДИТ НА СТРАНИЦУ ЗВОНКА */}
            <Button className="ihp-hero-btn" onClick={handleStartInterview}>
              ПРИСТУПИТЬ К ИНТЕРВЬЮ
            </Button>
          </div>

          <div className="ihp-hero-image">
            <img />
          </div>
        </section>

        {/* Дополнительная информация */}
        <div className="ihp-bottom-info">
          <p>После нажатия кнопки вы попадете в виртуальную комнату собеседования</p>
        </div>

        {/* Карточки фич */}
        <h3 className="ihp-section-title">ВАШИ ИНТЕРВЬЮ</h3>

        <div className="ihp-interview-card">
          <div className="ihp-interview-title">FULLSTACK<br />INTERVIEW</div>

          <div className="ihp-interview-date">
            <span className="ihp-calendar">📅</span> 18/10/2025
          </div>

          <button className="ihp-interview-btn" onClick={handleViewResults}>
            ПОСМОТРЕТЬ ФИДБЕК
          </button>
        </div>

      </div>
    </div>
  )
}