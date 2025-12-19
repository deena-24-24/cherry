import { Resume } from '../../types/resume'
import { useAuthStore } from '../../store'

const API_BASE_URL = 'http://localhost:5000/api'

/**
 * Получение резюме пользователя
 */
export const fetchResume = async (): Promise<Resume> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/candidate/resume`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка загрузки резюме')
  }

  return await response.json()
}

/**
 * Обновление резюме пользователя
 */
export const updateResume = async (resume: Resume): Promise<Resume> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/candidate/resume`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(resume)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка сохранения резюме')
  }

  const data = await response.json()
  return data.resume
}

