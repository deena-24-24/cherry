import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore, usePopupStore } from '../store'
import { ROUTES } from './routes'

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token } = useAuthStore()
  const { openAuth } = usePopupStore()

  if (!token) {
    // Open the authentication popup if the user is not logged in
    // This is a side-effect, should be handled carefully in real apps
    // A timeout ensures it runs after the current render cycle
    setTimeout(openAuth, 0)
    // Redirect to the home page
    return <Navigate to={ROUTES.HOME} replace />
  }

  return children
}