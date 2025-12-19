export const saveToken = (token: string): void => {
  localStorage.setItem('authToken', token)
}

export const getToken = (): string | null => {
  return localStorage.getItem('authToken')
}

export const removeToken = (): void => {
  localStorage.removeItem('authToken')
}

export const saveUser = (user): void => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const removeUser = (): void => {
  localStorage.removeItem('user')
}