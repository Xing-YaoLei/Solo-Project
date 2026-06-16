import { GAME_CONFIG } from '../game/constants'
import type { GameState, TrainingRecord, LeaderboardEntry } from '../game/types'
import { INSTRUMENTS } from '../config/instruments'

export class StorageManager {
  private static instance: StorageManager

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  saveGame(state: GameState): void {
    try {
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.SAVE_DATA, JSON.stringify(state))
    } catch (e) {
      console.error('Failed to save game:', e)
    }
  }

  loadGame(): GameState | null {
    try {
      const data = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.SAVE_DATA)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Failed to load game:', e)
      return null
    }
  }

  clearSave(): void {
    localStorage.removeItem(GAME_CONFIG.STORAGE_KEYS.SAVE_DATA)
  }

  addTrainingRecord(record: TrainingRecord): void {
    try {
      const records = this.getTrainingRecords()
      records.push(record)
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records))
    } catch (e) {
      console.error('Failed to add training record:', e)
    }
  }

  getTrainingRecords(): TrainingRecord[] {
    try {
      const data = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.TRAINING_RECORDS)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get training records:', e)
      return []
    }
  }

  clearTrainingRecords(): void {
    localStorage.removeItem(GAME_CONFIG.STORAGE_KEYS.TRAINING_RECORDS)
  }

  addLeaderboardEntry(entry: LeaderboardEntry): void {
    try {
      const entries = this.getLeaderboard()
      entries.push(entry)
      entries.sort((a, b) => b.score - a.score)
      const topEntries = entries.slice(0, 100)
      localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.LEADERBOARD, JSON.stringify(topEntries))
    } catch (e) {
      console.error('Failed to add leaderboard entry:', e)
    }
  }

  getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.LEADERBOARD)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get leaderboard:', e)
      return []
    }
  }

  clearLeaderboard(): void {
    localStorage.removeItem(GAME_CONFIG.STORAGE_KEYS.LEADERBOARD)
  }

  setTutorialCompleted(completed: boolean): void {
    localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.TUTORIAL_STATUS, JSON.stringify(completed))
  }

  isTutorialCompleted(): boolean {
    try {
      const data = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.TUTORIAL_STATUS)
      return data ? JSON.parse(data) : false
    } catch {
      return false
    }
  }

  getInitialGameState(): GameState {
    const instruments = Object.values(INSTRUMENTS).slice(0, 2).map(inst => ({ ...inst }))
    
    const calendar: GameState['calendar'] = []
    for (let i = 0; i < 7; i++) {
      calendar.push({
        date: `day_${i + 1}`,
        treatments: [],
        maxSlots: 6
      })
    }

    return {
      currentDay: 1,
      money: GAME_CONFIG.INITIAL_MONEY,
      reputation: GAME_CONFIG.INITIAL_REPUTATION,
      tasks: [],
      calendar,
      instruments,
      completedTasks: [],
      currentLevel: 1,
      tutorialCompleted: false
    }
  }
}
