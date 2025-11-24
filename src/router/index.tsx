import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'

// Layout
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import AuthPopup from '../components/popup/AuthPopup'
import { ProtectedRoute } from './ProtectedRoute'

// Pages
import { LandingPage } from '../pages/common/LandingPage'
import { ResumePage } from '../pages/candidate/ResumePage'
//import { AiInterviewPage } from '../pages/candidate/AiInterviewPage'
import { InterviewHomePage } from '../pages/candidate/InterviewHomePage'
import { InterviewCallPage } from '../pages/candidate/InterviewCallPage'

import { ChatPage } from '../pages/candidate/ChatPage'
import { CompilerPage } from '../pages/candidate/CompilerPage'

// Stores
import { usePopupStore } from '../store'
import { useAuthStore } from '../store'
import { User } from '../types'

export const AppRouter: React.FC = () => {
  const { isAuthOpen, closeAuth } = usePopupStore()
  const { login } = useAuthStore()

  const handleLogin = (userData: { user: User; token: string }) => {
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

          {/* РЕДИРЕКТЫ для старых пулов */}
          <Route
            path="/candidate/interview"
            element={<Navigate to={ROUTES.INTERVIEW_HOME} replace />}
          />
          <Route
            path="/candidate/interview/:sessionId"
            element={<Navigate to={ROUTES.INTERVIEW_CALL} replace />}
          />

          {/* Protected Routes */}
          <Route
            path={ROUTES.RESUME}
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />

          {/* Главная страница интервью (лендинг) */}
          <Route
            path={ROUTES.INTERVIEW_HOME}
            element={
              <ProtectedRoute>
                <InterviewHomePage />
              </ProtectedRoute>
            }
          />

          {/* Страница звонка */}
          <Route
            path={ROUTES.INTERVIEW_CALL}
            element={
              <ProtectedRoute>
                <InterviewCallPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.RESULTS}
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                  <h1 className="text-2xl">Страница результатов в разработке 📊</h1>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.TECH_CHAT}
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.COMPILER}
            element={
              <ProtectedRoute>
                <CompilerPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  )
}