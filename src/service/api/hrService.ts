import { useAuthStore } from '../../store'
import { API_URL } from '../../config'

const API_BASE_URL = `${API_URL}/api`

export interface HrData {
  userId?: string;
  // Базовые данные профиля
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  city?: string;
  about?: string;
  avatar?: string;
  // HR-специфичные поля
  companyName?: string;
  position?: string;
  // Метаданные
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Получение всех данных HR (профиль)
 */
export const fetchHr = async (): Promise<HrData> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/hr`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка загрузки данных HR')
  }

  return await response.json()
}

/**
 * Обновление всех данных HR
 */
export const updateHr = async (hrData: Partial<HrData>): Promise<HrData> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/hr`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(hrData)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка сохранения данных HR')
  }

  const data = await response.json()
  return data.hr
}

