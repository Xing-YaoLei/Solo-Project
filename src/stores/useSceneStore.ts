import { create } from 'zustand'
import type { CameraMode } from '@/types/training'

interface SceneState {
  cameraMode: CameraMode
  selectedEvidence: string | null
  highlightedObjects: string[]
  setCameraMode: (mode: CameraMode) => void
  selectEvidence: (id: string | null) => void
  clearSelection: () => void
}

export const useSceneStore = create<SceneState>((set) => ({
  cameraMode: 'orbit',
  selectedEvidence: null,
  highlightedObjects: [],
  setCameraMode: (mode) => set({ cameraMode: mode }),
  selectEvidence: (id) => set({ selectedEvidence: id }),
  clearSelection: () => set({ selectedEvidence: null, highlightedObjects: [] }),
}))
