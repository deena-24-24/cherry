import { User } from '../../types'
import { API_URL } from '../../config'

const API_BASE_URL = `${API_URL}/api/auth`

interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to login')
  }
  return data
}

export const registerUser = async (
  userData: Record<string, unknown>,
  userType: 'candidate' | 'hr'
): Promise<AuthResponse> => {
  const endpoint = `${API_BASE_URL}/register/${userType}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to register')
  }
  return data
}