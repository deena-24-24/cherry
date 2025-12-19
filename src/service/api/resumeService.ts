import { Resume } from '../../types/resume'
import { useAuthStore } from '../../store'
import { API_URL } from '../../config'

const API_BASE_URL = `${API_URL}/api/candidate/resumes`

export const fetchMyResumes = async (): Promise<Resume[]> => {
  const { token } = useAuthStore.getState()
  if (!token) throw new Error('No token')

  const response = await fetch(API_BASE_URL, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to fetch resumes')
  return response.json()
}

export const createResume = async (title: string, position: string): Promise<Resume> => {
  const { token } = useAuthStore.getState()
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, position })
  })
  if (!response.ok) throw new Error('Failed to create resume')
  return response.json()
}

export const updateResume = async (id: string, data: Partial<Resume>): Promise<Resume> => {
  const { token } = useAuthStore.getState()
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update resume')
  return response.json()
}

export const deleteResume = async (id: string): Promise<void> => {
  const { token } = useAuthStore.getState()
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Failed to delete resume')
}