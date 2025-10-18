import React from 'react'
import { NavLink } from 'react-router-dom'
import logoTitle from '../../../public/logo_title.svg'

import { ROUTES } from '../../router/routes'

export const Header: React.FC = () => {
  return (
    <header className="main-header pd-lg">
      <div className="container d-flex items-center justify-between">
        <NavLink to={ROUTES.HOME} className="logo">
          <img src={logoTitle} alt="Career Up Logo"/>
        </NavLink>
        <nav className="d-flex gap-md">
          <NavLink to={ROUTES.AI_INTERVIEW}>Interview</NavLink>
          <NavLink to={ROUTES.TECH_CHAT}>Chat</NavLink>
          <NavLink to={ROUTES.COMPILER}>Compiler</NavLink>
          {/*<NavLink to={ROUTES.AUTH}>Login</NavLink>*/}
          <NavLink to={ROUTES.RESUME_VIEW}>My resume</NavLink>
          {/*<NavLink to={ROUTES.RESUME_EDIT}>Edit Resume</NavLink>*/}
        </nav>
      </div>
    </header>
  )
}