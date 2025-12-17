import { useAuthStore } from '../../store'
import { CandidateData } from '../candidate/candidateService'
import { API_URL } from '../../config'

const API_BASE_URL = `${API_URL}/api`

/**
 * Получение списка всех кандидатов
 */
export const fetchCandidates = async (): Promise<CandidateData[]> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/hr/candidates`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка загрузки кандидатов')
  }

  return await response.json()
}

/**
 * Получение избранных кандидатов
 */
export const fetchFavorites = async (): Promise<CandidateData[]> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/hr/favorites`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка загрузки избранных кандидатов')
  }

  return await response.json()
}

/**
 * Добавление кандидата в избранное
 */
export const addToFavorites = async (candidateId: string): Promise<void> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/hr/favorites/${candidateId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка добавления в избранное')
  }
}

/**
 * Удаление кандидата из избранного
 */
export const removeFromFavorites = async (candidateId: string): Promise<void> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/hr/favorites/${candidateId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка удаления из избранного')
  }
}

