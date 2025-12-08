import { useAuthStore } from '../../store'

const API_BASE_URL = 'http://localhost:5000/api'

export interface ProfileData {
  name?: string
  email: string
  phone?: string
  country?: string
  about?: string
  firstName?: string
  lastName?: string
  companyName?: string
  position?: string
  [key: string]: unknown
}

export const fetchUserProfile = async (): Promise<ProfileData> => {
  const { token, user } = useAuthStore.getState()
  
  if (!token || !user) {
    throw new Error('Пользователь не авторизован')
  }

  try {
    // Используем /api/auth/me для получения базовых данных пользователя
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
      throw new Error(errorData.message || 'Ошибка получения профиля')
    }

    const data = await response.json()
    
    // Преобразуем данные в формат ProfileData
    const profileData: ProfileData = {
      email: data.email || '',
      name: data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}` 
        : data.email,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      country: data.country || '',
      about: data.about || '',
      companyName: data.companyName || '',
      position: data.position || ''
    }

    return profileData
  } catch (error) {
    console.error('Error fetching profile:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Ошибка получения профиля')
  }
}

export const updateUserProfile = async (profileData: Partial<ProfileData>): Promise<ProfileData> => {
  const { token, user } = useAuthStore.getState()
  
  if (!token || !user) {
    throw new Error('Пользователь не авторизован')
  }

  try {
    // Определяем endpoint в зависимости от роли
    const endpoint = user.role === 'candidate' 
      ? `${API_BASE_URL}/candidate/profile`
      : `${API_BASE_URL}/hr/profile`

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }))
      throw new Error(errorData.message || 'Ошибка обновления профиля')
    }

    const data = await response.json()
    return data.profile || data
  } catch (error) {
    console.error('Error updating profile:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Ошибка обновления профиля')
  }
}

