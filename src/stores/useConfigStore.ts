import { create } from 'zustand'
import type { LevelConfig, ItemConfig, AchievementConfig } from '@/types'
import * as persistence from '@/utils/persistence'
import level001 from '@/config/levels/level-001.json'
import level002 from '@/config/levels/level-002.json'
import level003 from '@/config/levels/level-003.json'
import itemsConfig from '@/config/items.json'
import achievementsConfig from '@/config/achievements.json'

interface ConfigOverrides {
  levels?: (Partial<LevelConfig> & { id: string })[]
  items?: (Partial<ItemConfig> & { id: string })[]
  achievements?: (Partial<AchievementConfig> & { id: string })[]
}

interface ConfigState {
  levels: LevelConfig[]
  items: ItemConfig[]
  achievements: AchievementConfig[]
}

interface ConfigActions {
  loadConfigs: () => void
  updateLevel: (id: string, partial: Partial<LevelConfig>) => void
  addItem: (item: ItemConfig) => void
  updateItem: (id: string, partial: Partial<ItemConfig>) => void
  addAchievement: (ach: AchievementConfig) => void
  updateAchievement: (id: string, partial: Partial<AchievementConfig>) => void
}

function applyOverrides<T extends { id: string }>(
  base: T[],
  overrides?: (Partial<T> & { id: string })[]
): T[] {
  if (!overrides) return base
  const result = [...base]
  for (const override of overrides) {
    const idx = result.findIndex((item) => item.id === override.id)
    if (idx !== -1) {
      result[idx] = { ...result[idx], ...override }
    }
  }
  return result
}

export const useConfigStore = create<ConfigState & ConfigActions>()((set) => ({
  levels: [],
  items: [],
  achievements: [],

  loadConfigs: () => {
    const baseLevels: LevelConfig[] = [level001, level002, level003] as LevelConfig[]
    const baseItems: ItemConfig[] = itemsConfig as ItemConfig[]
    const baseAchievements: AchievementConfig[] = achievementsConfig as AchievementConfig[]

    const overrides = persistence.load<ConfigOverrides>('config-overrides')

    set({
      levels: applyOverrides(baseLevels, overrides?.levels),
      items: applyOverrides(baseItems, overrides?.items),
      achievements: applyOverrides(baseAchievements, overrides?.achievements),
    })
  },

  updateLevel: (id, partial) => {
    set((state) => {
      const levels = state.levels.map((l) =>
        l.id === id ? { ...l, ...partial } : l
      )
      const overrides = persistence.load<ConfigOverrides>('config-overrides') ?? {}
      const levelOverrides = overrides.levels ?? []
      const existingIdx = levelOverrides.findIndex((o) => o.id === id)
      if (existingIdx !== -1) {
        levelOverrides[existingIdx] = { ...levelOverrides[existingIdx], ...partial, id }
      } else {
        levelOverrides.push({ id, ...partial })
      }
      persistence.save('config-overrides', { ...overrides, levels: levelOverrides })
      return { levels }
    })
  },

  addItem: (item) => {
    set((state) => {
      const overrides = persistence.load<ConfigOverrides>('config-overrides') ?? {}
      persistence.save('config-overrides', {
        ...overrides,
        items: [...(overrides.items ?? []), item as Partial<ItemConfig> & { id: string }],
      })
      return { items: [...state.items, item] }
    })
  },

  updateItem: (id, partial) => {
    set((state) => {
      const items = state.items.map((i) =>
        i.id === id ? { ...i, ...partial } : i
      )
      const overrides = persistence.load<ConfigOverrides>('config-overrides') ?? {}
      const itemOverrides = overrides.items ?? []
      const existingIdx = itemOverrides.findIndex((o) => o.id === id)
      if (existingIdx !== -1) {
        itemOverrides[existingIdx] = { ...itemOverrides[existingIdx], ...partial, id }
      } else {
        itemOverrides.push({ id, ...partial })
      }
      persistence.save('config-overrides', { ...overrides, items: itemOverrides })
      return { items }
    })
  },

  addAchievement: (ach) => {
    set((state) => {
      const overrides = persistence.load<ConfigOverrides>('config-overrides') ?? {}
      persistence.save('config-overrides', {
        ...overrides,
        achievements: [...(overrides.achievements ?? []), ach as Partial<AchievementConfig> & { id: string }],
      })
      return { achievements: [...state.achievements, ach] }
    })
  },

  updateAchievement: (id, partial) => {
    set((state) => {
      const achievements = state.achievements.map((a) =>
        a.id === id ? { ...a, ...partial } : a
      )
      const overrides = persistence.load<ConfigOverrides>('config-overrides') ?? {}
      const achOverrides = overrides.achievements ?? []
      const existingIdx = achOverrides.findIndex((o) => o.id === id)
      if (existingIdx !== -1) {
        achOverrides[existingIdx] = { ...achOverrides[existingIdx], ...partial, id }
      } else {
        achOverrides.push({ id, ...partial })
      }
      persistence.save('config-overrides', { ...overrides, achievements: achOverrides })
      return { achievements }
    })
  },
}))
