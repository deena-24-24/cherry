import React from 'react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../router/routes'
import * as styles from './Header.module.css'

export const CandidateNavigation: React.FC = () => {
  return (
    <>
      <NavLink 
        to={`${ROUTES.AI_INTERVIEW.replace(':session_id', 'session_1')}`}
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        ИНТЕРВЬЮ
      </NavLink>
      <NavLink 
        to={ROUTES.AI_CHAT}
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        ЧАТ
      </NavLink>
      <NavLink
        to={ROUTES.HR_CHAT}
        className={({ isActive }) =>
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        HR ЧАТ
      </NavLink>
      <NavLink 
        to={ROUTES.COMPILER} 
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        КОМПИЛЯТОР
      </NavLink>
      <NavLink 
        to={ROUTES.RESUME} 
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        МОЁ РЕЗЮМЕ
      </NavLink>
    </>
  )
}

