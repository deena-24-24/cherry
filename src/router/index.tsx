import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ROUTES } from './routes'

// Layout
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import AuthPopup from '../components/popup/AuthPopup'

// Pages
import { LandingPage } from '../pages/common/LandingPage'
import { ResumePage } from '../pages/candidate/ResumePage'
import { AiInterviewPage } from '../pages/candidate/AiInterviewPage'
import { TechnicalChatPage } from '../pages/candidate/TechnicalChatPage'
import { CompilerPage } from '../pages/candidate/CompilerPage'

// Stores
import { usePopupStore } from '../store/usePopupStore'
import { useAuthStore } from '../store/useAuthStore'

export const AppRouter: React.FC = () => {
  const { isAuthOpen, closeAuth } = usePopupStore()
  const { login } = useAuthStore()

  const handleLogin = (userData) => {
    if (userData && userData.user && userData.token) {
      login(userData.user, userData.token)
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen">
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.RESUME} element={<ResumePage />} />
          <Route path={ROUTES.AI_INTERVIEW} element={<AiInterviewPage />} />
          <Route path={ROUTES.TECH_CHAT} element={<TechnicalChatPage />} />
          <Route path={ROUTES.COMPILER} element={<CompilerPage />} />
        </Routes>
      </main>

      <Footer />

      <AuthPopup
        isOpen={isAuthOpen}
        onClose={closeAuth}
        onLogin={handleLogin}
      />
    </>
  )
}