const PREFIX = 'bnb_'

export interface User {
  id: string
  name: string
  role: 'student' | 'admin'
  totalScore: number
}

export interface QuestionResult {
  id: string
  recordId: string
  questionId: string
  type: 'evidence' | 'tag' | 'calendar' | 'task'
  isCorrect: boolean
  timeSpent: number
  recommendedTime: number
  hesitationPoints: number
  userAnswer: string
}

export interface ReplayData {
  id: string
  recordId: string
  actionLog: Array<{ timestamp: number; actionType: string; payload: unknown }>
  hesitationThreshold: number
  createdAt: string
}

export interface TrainingRecord {
  id: string
  userId: string
  levelId: string
  score: number
  onTimeRate: number
  status: 'completed' | 'failed'
  startTime: string
  endTime: string
  results: QuestionResult[]
}

export interface RewardItem {
  id: string
  type: 'points' | 'badge' | 'level'
  threshold: number
  value: string
}

export interface TimeSlot {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  maxAttempts: number
}

export interface ModeParam {
  id: string
  key: string
  value: string
}

export interface ConfigBundle {
  rewards: RewardItem[]
  schedule: TimeSlot[]
  modes: ModeParam[]
}

function prefixedKey(key: string): string {
  return `${PREFIX}${key}`
}

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(prefixedKey(key))
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(prefixedKey(key), JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

export function removeItem(key: string): void {
  localStorage.removeItem(prefixedKey(key))
}

export function getUser(): User | null {
  return getItem<User>('user')
}

export function setUser(user: User): void {
  setItem('user', user)
}

export function removeUser(): void {
  removeItem('user')
}

export function getRecords(): TrainingRecord[] {
  return getItem<TrainingRecord[]>('records') ?? []
}

export function setRecords(records: TrainingRecord[]): void {
  setItem('records', records.slice(0, 100))
}

export function addRecord(record: TrainingRecord): void {
  const records = getRecords()
  records.unshift(record)
  setRecords(records)
}

export function removeRecords(): void {
  removeItem('records')
}

export function getReplays(): ReplayData[] {
  return getItem<ReplayData[]>('replays') ?? []
}

export function setReplays(replays: ReplayData[]): void {
  setItem('replays', replays)
}

export function addReplay(replay: ReplayData, maxPerLevel: number = 3): void {
  const replays = getReplays()
  replays.unshift(replay)
  const levelReplayCount: Record<string, number> = {}
  const filtered: ReplayData[] = []
  for (const r of replays) {
    const record = getRecords().find((rec) => rec.id === r.recordId)
    const levelId = record?.levelId ?? 'unknown'
    levelReplayCount[levelId] = (levelReplayCount[levelId] ?? 0) + 1
    if (levelReplayCount[levelId] <= maxPerLevel) {
      filtered.push(r)
    }
  }
  setReplays(filtered)
}

export function removeReplays(): void {
  removeItem('replays')
}

export function getConfig(): ConfigBundle | null {
  return getItem<ConfigBundle>('config')
}

export function setConfig(config: ConfigBundle): void {
  setItem('config', config)
}

export function removeConfig(): void {
  removeItem('config')
}
