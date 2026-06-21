import { GameConfig, TrainingRecord, UserProgress } from '@/types'

const KEYS = {
  config: 'law_game_config',
  records: 'law_game_records',
  progress: 'law_game_progress',
}

export function loadConfig(): GameConfig | null {
  const raw = localStorage.getItem(KEYS.config)
  return raw ? JSON.parse(raw) : null
}

export function saveConfig(config: GameConfig): void {
  localStorage.setItem(KEYS.config, JSON.stringify(config))
}

export function loadRecords(): TrainingRecord[] {
  const raw = localStorage.getItem(KEYS.records)
  return raw ? JSON.parse(raw) : []
}

export function saveRecords(records: TrainingRecord[]): void {
  localStorage.setItem(KEYS.records, JSON.stringify(records))
}

export function addRecord(record: TrainingRecord): void {
  const records = loadRecords()
  records.push(record)
  saveRecords(records)
}

export function loadProgress(): UserProgress {
  const raw = localStorage.getItem(KEYS.progress)
  if (raw) return JSON.parse(raw)
  return {
    userId: 'player_1',
    totalScore: 0,
    completedLevels: [],
    tutorialDone: false,
    stars: {},
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(KEYS.progress, JSON.stringify(progress))
}
