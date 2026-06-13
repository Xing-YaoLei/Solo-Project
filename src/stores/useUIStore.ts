import { create } from 'zustand'

type PanelType = 'tasks' | 'items' | 'events'
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface UIState {
  isPanelOpen: boolean
  activePanel: PanelType | null
  showEffectPhoto: boolean
  effectPhotoData: { before: string; after: string } | null
  toasts: Toast[]
}

interface UIActions {
  togglePanel: (panel: PanelType) => void
  closePanel: () => void
  showEffect: (before: string, after: string) => void
  hideEffect: () => void
  addToast: (message: string, type: ToastType) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  isPanelOpen: false,
  activePanel: null,
  showEffectPhoto: false,
  effectPhotoData: null,
  toasts: [],

  togglePanel: (panel) => {
    set((state) => {
      if (state.activePanel === panel && state.isPanelOpen) {
        return { isPanelOpen: false, activePanel: null }
      }
      return { isPanelOpen: true, activePanel: panel }
    })
  },

  closePanel: () => {
    set({ isPanelOpen: false, activePanel: null })
  },

  showEffect: (before, after) => {
    set({ showEffectPhoto: true, effectPhotoData: { before, after } })
  },

  hideEffect: () => {
    set({ showEffectPhoto: false, effectPhotoData: null })
  },

  addToast: (message, type) => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
