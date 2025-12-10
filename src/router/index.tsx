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
import { ProfilePage } from '../pages/ProfilePage/ProfilePage'
import { AiInterviewPage } from '../pages/candidate/AiInterviewPage'
import { AiChatPage } from '../pages/candidate/AiChatPage'
import { HrChatPage } from '../pages/candidate/HrChatPage'
import { CompilerPage } from '../pages/candidate/CompilerPage'
import { HrProfilePage } from '../pages/hr/HrProfilePage'
import { HrDashboardPage } from '../pages/hr/HrDashboardPage'
import { HrCandidatesPage } from '../pages/hr/HrCandidatesPage'

// Stores
import { usePopupStore } from '../store'
import { useAuthStore } from '../store'
import { User } from '../types'

export const AppRouter: React.FC = () => {
  const { isAuthOpen, closeAuth } = usePopupStore()
  const { login } = useAuthStore()

  const handleLogin = (userData: { user: User; token: string }) => {
    console.log('handleLogin called with:', userData)
    if (userData && userData.user && userData.token) {
      console.log('Calling login with user:', userData.user, 'token:', userData.token)
      login(userData.user, userData.token)
      console.log('Login completed')
    } else {
      console.error('Invalid userData:', userData)
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen">
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />

          {/* редирект для базового роута /interview */}
          <Route
            path="/candidate/interview"
            element={<Navigate to={`/candidate/interview/session_1`} replace />}
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
          <Route
            path={ROUTES.AI_INTERVIEW}
            element={
              <ProtectedRoute>
                <AiInterviewPage />
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
            path={ROUTES.HR_CHAT}
            element={
              <ProtectedRoute>
                <HrChatPage />
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
          
          {/* HR Routes */}
          <Route
            path={ROUTES.HR_DASHBOARD}
            element={
              <ProtectedRoute>
                <HrDashboardPage />
              </ProtectedRoute>
            }
          />
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
            path={ROUTES.HR_CHAT}
            element={
              <ProtectedRoute>
                <HrChatPage />
              </ProtectedRoute>
            }
          />
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