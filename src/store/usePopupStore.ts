import { create } from 'zustand'

interface PopupState {
  isAuthOpen: boolean
  openAuth: () => void
  closeAuth: () => void
}

export const usePopupStore = create<PopupState>((set) => ({
  isAuthOpen: false,
  openAuth: () => set({ isAuthOpen: true }),
  closeAuth: () => set({ isAuthOpen: false }),
}))
