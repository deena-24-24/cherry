import CandImage from "../../assets/cand_home.png"
import HrImage from "../../assets/hr_home.png"
import React, { useState } from 'react'
import * as styles from './BannerMainDesktop.module.css'

export const BannerMainDesktop: React.FC = () => {
  const [hoverLeft, setHoverLeft] = useState(false)
  const [hoverRight, setHoverRight] = useState(false)

  return (
    <div className={styles["banner"]}>

      <div
        className={`${styles["column"]} ${styles["left"]} `}
        onMouseEnter={() => setHoverLeft(true)}
        onMouseLeave={() => setHoverLeft(false)}
      >

        <div className={styles["banner-subtitle"]}>Я готовлюсь к собеседованию</div>
        <div className={styles["image-area"]} style={{ opacity: hoverRight ? 0 : 1 }}>
          <img src={CandImage} alt="Кандидат" />
        </div>

        <div className={styles["info-panel"]} style={{ opacity: hoverRight ? 1 : 0 }}>
          <div className={styles["feature"]} style={{
            opacity: hoverRight ? 1 : 0,
            transform: hoverRight ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: hoverRight ? '0.15s' : '0s'
          }}>
            <div className={styles["feature-title"]}>ПРОСМОТР КАНДИДАТОВ</div>
            <div className={styles["feature-text"]}>
              Фильтруйте и просматривайте опубликованные резюме от соискателей
            </div>
          </div>

          <div className={styles["feature"]} style={{
            opacity: hoverRight ? 1 : 0,
            transform: hoverRight ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: hoverRight ? '0.3s' : '0s'
          }}>
            <div className={styles["feature-title"]}>СВЯЗЬ</div>
            <div className={styles["feature-text"]}>
              Пишите подходящим кандидатам на нашей платформе
            </div>
          </div>

        </div>
      </div>

      <div
        className={`${styles["column"]} ${styles["right"]}`}
        onMouseEnter={() => setHoverRight(true)}
        onMouseLeave={() => setHoverRight(false)}
      >
        <div className={styles["banner-subtitle"]}>Я хочу найти новых сотрудников</div>
        <div className={styles["image-area"]} style={{ opacity: hoverLeft ? 0 : 1 }}>
          <img src={HrImage} alt="HR" />
        </div>

        <div className={styles["info-panel"]} style={{ opacity: hoverLeft ? 1 : 0 }}>
          <div className={styles["feature"]} style={{
            opacity: hoverLeft ? 1 : 0,
            transform: hoverLeft ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: hoverLeft ? '0.15s' : '0s'
          }}>
            <div className={styles["feature-title"]}>ИИ-СОБЕСЕДОВАНИЕ</div>
            <div className={styles["feature-text"]}>
              Оттачивайте навыки прохождения технического интервью с ИИ-ассистентом, а также изучайте интересующее Вас в чате с ИИ.
            </div>
          </div>

          <div className={styles["feature"]} style={{
            opacity: hoverLeft ? 1 : 0,
            transform: hoverLeft ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: hoverLeft ? '0.3s' : '0s'
          }}>
            <div className={styles["feature-title"]}>РЕЗЮМЕ</div>
            <div className={styles["feature-text"]}>
              Расскажите о себе и своих навыках в резюме, которое увидят HR-специалисты из реальных компаний
            </div>
          </div>

          <div className={styles["feature"]} style={{
            opacity: hoverLeft ? 1 : 0,
            transform: hoverLeft ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: hoverLeft ? '0.45s' : '0s'
          }}>
            <div className={styles["feature-title"]}>ПРЕДЛОЖЕНИЯ О НАЙМЕ</div>
            <div className={styles["feature-text"]}>
              Поддерживайте связь с HR-менеджерами, заинтересованными в вашей кандидатуре, прямо на платформе
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}