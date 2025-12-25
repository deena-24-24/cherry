import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'

// Layout
// import { Header } from '../components/layout/Header'
// import { Footer } from '../components/layout/Footer'
import AuthPopup from '../components/popup/AuthPopup'
import { ProtectedRoute } from './ProtectedRoute'

// Pages
import { LandingPage } from '../pages/common/LandingPage'
import { ProfilePage } from '../pages/candidate/ProfilePage'
import { InterviewHomePage } from '../pages/candidate/InterviewHomePage'
import { InterviewCallPage } from '../pages/candidate/InterviewCallPage'
import { InterviewResultsPage } from '../pages/candidate/InterviewResultsPage'
import { AiChatPage } from '../pages/candidate/AiChatPage'
import { ChatPage } from '../pages/common/ChatPage'
import { HrProfilePage } from '../pages/hr/HrProfilePage'
import { HrCandidatesPage } from '../pages/hr/HrCandidatesPage'

// Stores
import { usePopupStore } from '../store'
import { useAuthStore } from '../store'
import { User } from '../types'
import { MainLayout } from '../components/layout/MainLayout'

export const AppRouter: React.FC = () => {
  const { isAuthOpen, closeAuth } = usePopupStore()
  const { login } = useAuthStore()

  const handleLogin = (userData: { user: User; token: string }) => {
    if (userData && userData.user && userData.token) {
      login(userData.user, userData.token)
    } else {
      console.error('Invalid userData:', userData)
    }
  }

  return (
    <>
      <main className="min-h-screen">
        <Routes>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.HOME} element={<LandingPage />} />

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
                  <ProfilePage />
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

            <Route
              path={ROUTES.RESULTS}
              element={
                <ProtectedRoute>
                  {<InterviewResultsPage />}
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.AI_CHAT}
              element={
                <ProtectedRoute>
                  <AiChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CHAT}
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />

            {/* HR Routes */}
            <Route
              path={ROUTES.HR_PROFILE}
              element={
                <ProtectedRoute>
                  <HrProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.HR_CANDIDATES}
              element={
                <ProtectedRoute>
                  <HrCandidatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CHAT}
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Страница звонка - без хедера и футера */}
          <Route
            path={ROUTES.INTERVIEW_CALL}
            element={
              <ProtectedRoute>
                <InterviewCallPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <AuthPopup
        isOpen={isAuthOpen}
        onClose={closeAuth}
        onLogin={handleLogin}
      />
    </>
  )
}