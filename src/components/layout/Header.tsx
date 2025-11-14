import React from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../ui/Button'
import { ROUTES } from '../../router/routes'
import { usePopupStore } from '../../store'
import { useAuthStore } from '../../store'
import { CandidateNavigation } from './CandidateNavigation'
import { HrNavigation } from './HrNavigation'
import logoTitle from '../../assets/logo_title.svg'
import * as styles from './Header.module.css'

export const Header: React.FC = () => {
  const { openAuth } = usePopupStore()
  const { user, logout } = useAuthStore()

  const handleAuthClick = () => {
    if (user) {
      logout()
    } else {
      openAuth()
    }
  }

  return (
    <div className={styles["header"]}>
      <div className={styles["headerContainer"]}>
        <div className={styles["headerContent"]}>
          {/* Логотип */}
          <NavLink to={ROUTES.HOME} className={styles["logoLink"]}>
            <img
              src={logoTitle}
              alt="Career Up Logo"
              className={styles["logo"]}
            />
          </NavLink>

          {/* Навигация */}
          <div className={styles["navContainer"]}>
            {user && (
              user.role === 'candidate' ? (
                <CandidateNavigation />
              ) : (
                <HrNavigation />
              )
            )}
            <Button
              className={styles["loginButton"]}
              onClick={handleAuthClick}
              // color={pink}
            >
              <span className={styles["loginButtonText"]}>
                {user ? 'ВЫХОД' : 'ВХОД'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
