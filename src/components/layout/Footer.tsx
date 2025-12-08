import React from 'react'
import * as styles from './Footer.module.css'

export const Footer: React.FC = () => {
  return (
    <div className={styles["footer"]}>
      <div className={styles["footerBackground"]} />
      
      {/* Левая часть - Логотип */}
      <div className={styles["logoSection"]}>
        <div className={styles["logoText"]}>CareerUp</div>
      </div>

      {/* Средняя часть - Обучение */}
      <div className={styles["info"]}>
        <div className={`${styles["section"]} ${styles["sectionLearning"]}`}>
          <div className={styles["sectionTitle"]}>Обучение</div>
          <div className={styles["sectionLink"]}>ИИ-собеседования</div>
          <div className={styles["sectionLink"]}>Резюме</div>
          <div className={styles["sectionLink"]}>Задачи</div>
          <div className={styles["sectionLink"]}>Профиль</div>
        </div>

        {/* Правая часть - Связаться с нами */}
        <div className={`${styles["section"]} ${styles["sectionContact"]}`}>
          <div className={styles["contactTitle"]}>Связаться с нами</div>
          <div className={styles["sectionLink"]}>Telegram</div>
          <div className={styles["sectionLink"]}>contact@careerup.com</div>
        </div>
      </div>
    </div>
  )
}
