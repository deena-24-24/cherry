import React from 'react'
import { NavLink } from 'react-router-dom'
import logoTitle from '../../../public/logo_title.svg'
import { Button } from '../ui/Button'

import { ROUTES } from '../../router/routes'

import { usePopupStore } from '../../store'

export const Header: React.FC = () => {
  const { openAuth } = usePopupStore()
  return (
    <header className="main-header pd-lg">
      <div className="container d-flex items-center justify-between">
        <NavLink to={ROUTES.HOME} className="logo">
          <img src={logoTitle} alt="Career Up Logo"/>
        </NavLink>
        <nav className="d-flex gap-md">
          <NavLink to={ROUTES.AI_INTERVIEW}>Interview</NavLink>
          <NavLink to={ROUTES.AI_CHAT}>Chat</NavLink>
          <NavLink to={ROUTES.HR_CHAT}>HR Chats</NavLink>
          <NavLink to={ROUTES.COMPILER}>Compiler</NavLink>
          <NavLink to={ROUTES.RESUME}>My resume</NavLink>
        </nav>
        <Button onClick={openAuth}>Войти</Button>
      </div>
    </header>
  )
}