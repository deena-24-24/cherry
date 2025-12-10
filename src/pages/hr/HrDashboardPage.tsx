import React from 'react'
import { useAuthStore } from '../../store'
import * as styles from './HrDashboardPage.module.css'

export const HrDashboardPage: React.FC = () => {
  const { user } = useAuthStore()

  return (
    <div className={styles["page"]}>
      <div className={styles["title"]}>
        ДАШБОРД HR
      </div>
      
      <div className={styles["container"]}>
        <div className={styles["welcome"]}>
          <h2>Добро пожаловать, {user?.firstName || 'HR-специалист'}!</h2>
          <p>Здесь вы можете управлять кандидатами и просматривать статистику</p>
        </div>
        
        <div className={styles["stats"]}>
          <div className={styles["statCard"]}>
            <h3>Всего кандидатов</h3>
            <p className={styles["statNumber"]}>0</p>
          </div>
          <div className={styles["statCard"]}>
            <h3>Активных интервью</h3>
            <p className={styles["statNumber"]}>0</p>
          </div>
          <div className={styles["statCard"]}>
            <h3>Новых заявок</h3>
            <p className={styles["statNumber"]}>0</p>
          </div>
        </div>
      </div>
    </div>
  )
}

