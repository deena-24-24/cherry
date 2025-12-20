import React from 'react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../../router/routes'
import * as styles from '../../layout/Header.module.css'

export const CandidateNavigation: React.FC = () => {
  return (
    <>
      <NavLink 
        to={`${ROUTES.INTERVIEW_HOME.replace(':session_id', 'session_1')}`}
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
        AI ЧАТ
      </NavLink>
      <NavLink
        to={ROUTES.CHAT}
        className={({ isActive }) =>
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        HR ЧАТ
      </NavLink>
      <NavLink 
        to={ROUTES.RESUME} 
        className={({ isActive }) => 
          `${styles["navLink"]} ${isActive ? styles["navLinkActive"] : ''}`
        }
      >
        ПРОФИЛЬ
      </NavLink>
    </>
  )
}

