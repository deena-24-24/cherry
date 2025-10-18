import React from 'react'
import { Routes, Route } from 'react-router-dom'

import { HomePage } from '../pages/HomePage'
import { AuthorizationPage } from '../pages/AuthorizationPage'
import { ResumeCreateUpdatePage } from '../pages/ResumeCreateUpdatePage'
import { ResumeViewPage } from '../pages/ResumeViewPage'
import { AiInterviewPage } from '../pages/AiInterviewPage'
import { TechnicalChatPage } from '../pages/TechnicalChatPage'
import { CompilerPage } from '../pages/CompilerPage'

import { ROUTES } from './routes'

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomePage />} />
      <Route path={ROUTES.AUTH} element={<AuthorizationPage />} />
      <Route path={ROUTES.RESUME_EDIT} element={<ResumeCreateUpdatePage />} />
      <Route path={ROUTES.RESUME_VIEW} element={<ResumeViewPage />} />
      <Route path={ROUTES.AI_INTERVIEW} element={<AiInterviewPage />} />
      <Route path={ROUTES.TECH_CHAT} element={<TechnicalChatPage />} />
      <Route path={ROUTES.COMPILER} element={<CompilerPage />} />
    </Routes>
  )
}