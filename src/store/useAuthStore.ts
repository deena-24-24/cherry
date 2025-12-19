import { create } from 'zustand'
import { User } from '../types'
import * as localStorageService from '../service/api/localStorageService'

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: localStorageService.getUser(),
  token: localStorageService.getToken(),

  login: (user, token) => {
    localStorageService.saveUser(user)
    localStorageService.saveToken(token)
    set({ user, token })
  },

  logout: () => {
    localStorageService.removeUser()
    localStorageService.removeToken()
    set({ user: null, token: null })
  },

  updateUser: (userData) => {
    const currentUser = get().user
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData }

      localStorageService.saveUser(updatedUser)

      set({ user: updatedUser })
    }
  },
}))