import React from 'react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../../router/routes'
import * as styles from '../../layout/Header.module.css'

export const HrNavigation: React.FC = () => {
  return (
    <>
      <NavLink 
        to={ROUTES.HR_CANDIDATES}
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        КАНДИДАТЫ
      </NavLink>
      <NavLink 
        to={ROUTES.CHAT}
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        ЧАТ
      </NavLink>
      <NavLink 
        to={ROUTES.HR_PROFILE} 
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        ПРОФИЛЬ
      </NavLink>
    </>
  )
}

