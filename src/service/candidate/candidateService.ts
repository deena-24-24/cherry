import { useAuthStore } from '../../store'

const API_BASE_URL = 'http://localhost:5000/api'

export interface CandidateData {
  userId?: string;
  // Базовые данные профиля
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  country?: string;
  about?: string;
  avatar?: string;
  // Данные резюме
  jobTitle?: string;
  experience?: Array<{
    title: string;
    company: string;
    period: string;
    description?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills?: string[];
  resumeFileName?: string;
  resumeFileData?: string; // base64 encoded PDF
  // Метаданные
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Получение всех данных кандидата (профиль + резюме)
 */
export const fetchCandidate = async (): Promise<CandidateData> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/candidate`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка загрузки данных кандидата')
  }

  return await response.json()
}

/**
 * Обновление всех данных кандидата
 */
export const updateCandidate = async (candidateData: Partial<CandidateData>): Promise<CandidateData> => {
  const { token } = useAuthStore.getState()
  
  if (!token) {
    throw new Error('Токен не найден')
  }

  const response = await fetch(`${API_BASE_URL}/candidate`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(candidateData)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
    throw new Error(errorData.message || 'Ошибка сохранения данных кандидата')
  }

  const data = await response.json()
  return data.candidate
}

