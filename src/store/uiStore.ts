import { create } from 'zustand'

export interface ToastState {
  id: number
  message: string
  actionLabel?: string
  onAction?: () => void
}

interface UiState {
  toast: ToastState | null
  showToast: (message: string, action?: { label: string; onAction: () => void }) => void
  dismissToast: () => void
  updateAvailable: boolean
  applyUpdate: (() => void) | null
  setUpdateAvailable: (apply: () => void) => void
}

let toastCounter = 0

export const useUiStore = create<UiState>((set) => ({
  toast: null,
  showToast: (message, action) => {
    toastCounter += 1
    set({ toast: { id: toastCounter, message, actionLabel: action?.label, onAction: action?.onAction } })
  },
  dismissToast: () => set({ toast: null }),
  updateAvailable: false,
  applyUpdate: null,
  setUpdateAvailable: (apply) => set({ updateAvailable: true, applyUpdate: apply }),
}))
