import React from 'react'
import * as styles from './Footer.module.css'

import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../router/routes'
import { useAuthStore } from '../../store'


export const Footer: React.FC = () => {
  const { user } = useAuthStore()
  return (
    <footer className={styles["footer"]}>

      <div className={styles["inner"]}>

        {/* Лого */}
        <div className={styles['logoSection']}>
          <div className={styles["logoText"]}>CareerUp</div>
        </div>

        {/* Блоки обучения и контактов */}
        <div className={styles["sections"]}>

          {/* ОБУЧЕНИЕ */}
          <div className={styles["section"]}>
            {user && (
              user.role === 'candidate' ? (
                <div className={styles["section"]}>
                  <div className={styles["sectionTitle"]}>Обучение</div>
                  <NavLink to={ROUTES.INTERVIEW_HOME} className={styles["link"]}>
                    ИИ-собеседования
                  </NavLink>
                  <NavLink to={ROUTES.AI_CHAT} className={styles["link"]}>
                    AI-Чат
                  </NavLink>
                  <NavLink to={ROUTES.CHAT} className={styles["link"]}>
                    HR-Чат
                  </NavLink>
                  <NavLink to={ROUTES.RESUME} className={styles["link"]}>
                    Профиль
                  </NavLink>
                </div>
              ) : (
                <div className={styles["section"]}>
                  <div className={styles["sectionTitle"]}>Поиск кандидатов</div>
                  <NavLink to={ROUTES.CHAT} className={styles["link"]}>
                    Чаты
                  </NavLink>
                  <NavLink to={ROUTES.HR_CANDIDATES} className={styles["link"]}>
                    Кандидаты
                  </NavLink>
                  <NavLink to={ROUTES.HR_PROFILE} className={styles["link"]}>
                    Профиль
                  </NavLink>
                </div>
              ))}
          </div>

          {/* КОНТАКТЫ */}
          <div className={styles["section"]}>
            <div className={styles["sectionTitle"]}>Связаться с нами</div>

            <a className={styles["link"]} href="https://t.me/...">Telegram</a>
            <a className={styles["link"]} href="mailto:contact@careerup.com">
              contact@careerup.com
            </a>
          </div>

        </div>
      </div>

    </footer>
  )
}

