import React from "react"
import * as styles from "./ProgressContent.module.css"

export const ProgressContent: React.FC = () => {
  return (
    <div className={styles["progressContainer"]}>
      {/* Блок "Задач решено" */}
      <div className={styles["tasksBlock"]}>
        <div className={styles["tasksBackground"]} />
        <div className={styles["tasksTitle"]}>Задач решено</div>
        
        {/* Легкие задачи */}
        <div className={styles["taskLabel"]} style={{ top: '63px' }}>
          <span className={styles["taskText"]}>Легк</span>
          <span className={styles["taskTextMono"]}>и</span>
          <span className={styles["taskText"]}>е</span>
        </div>
        <div className={styles["taskProgress"]} style={{ top: '76px' }} />
        <div className={styles["taskCount"]} style={{ top: '63px' }}>0/15</div>
        
        {/* Средние задачи */}
        <div className={styles["taskLabel"]} style={{ top: '104px' }}>Средние</div>
        <div className={styles["taskProgress"]} style={{ top: '117px' }} />
        <div className={styles["taskCount"]} style={{ top: '104px' }}>0/15</div>
        
        {/* Сложные задачи */}
        <div className={styles["taskLabel"]} style={{ top: '145px' }}>Сложные</div>
        <div className={styles["taskProgress"]} style={{ top: '158px' }} />
        <div className={styles["taskCount"]} style={{ top: '145px' }}>0/15</div>
      </div>

      {/* Блок "ИИ-Собеседований" */}
      <div className={styles["interviewsBlock"]}>
        {/* Левая карточка */}
        <div className={styles["interviewCardLeft"]}>
          <div className={styles["interviewCardBackground"]} />
          <div className={styles["interviewCardTitle"]}>ИИ-Собеседований Пройдено</div>
          <div className={styles["interviewStat"]} style={{ top: '64px' }}>Всего</div>
          <div className={styles["interviewStatValue"]} style={{ top: '60px', left: '371px' }}>11</div>
          <div className={styles["interviewStat"]} style={{ top: '105px' }}>Успешно*</div>
          <div className={styles["interviewStatValue"]} style={{ top: '105px', left: '373px' }}>5</div>
        </div>

        {/* Правая карточка */}
        <div className={styles["interviewCardRight"]}>
          <div className={styles["interviewCardBackground"]} />
          <div className={styles["averageScoreTitle"]}>Средний балл за собеседования</div>
          <div className={styles["averageScoreValue"]}>7.7 / 10</div>
        </div>
      </div>
    </div>
  )
}
