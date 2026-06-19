import type {
  User,
  TrainingRecord,
  QuestionResult,
  ReplayData,
  RewardItem,
  TimeSlot,
  ModeParam,
  ConfigBundle
} from './storage'

export interface Level {
  id: string
  name: string
  difficulty: 1 | 2 | 3
  isOpen: boolean
  openTime: string
  closeTime: string
  description: string
  reward: number
}

export interface Evidence {
  id: string
  name: string
  description: string
  isCorrect: boolean
  position: { x: number; y: number; z: number }
}

export interface TagOption {
  id: string
  label: string
  isCorrect: boolean
}

export interface CalendarTaskConfig {
  id: string
  roomId: string
  checkOut: string
  nextCheckIn: string
  priority: number
  requiredMinutes: number
  assignedTo: string
}

export interface CleaningTask {
  id: string
  roomId: string
  type: 'daily' | 'deep' | 'turnover' | 'inspection'
  priority: 1 | 2 | 3
  deadline: string
  assignedTo: string
}

export interface Question {
  id: string
  levelId: string
  type: 'evidence' | 'tag' | 'calendar' | 'task'
  description: string
  score: number
  recommendedTime: number
  correctReason: string
  evidences?: Evidence[]
  reviewText?: string
  tagOptions?: TagOption[]
  calendarTasks?: CalendarTaskConfig[]
  cleaningTasks?: CleaningTask[]
}

export const mockLevels: Level[] = [
  {
    id: 'level-1',
    name: '新手入门',
    difficulty: 1,
    isOpen: true,
    openTime: '2024-01-01T00:00:00Z',
    closeTime: '2025-12-31T23:59:59Z',
    description: '熟悉基本的保洁调度流程，学习识别常见客诉证据',
    reward: 100
  },
  {
    id: 'level-2',
    name: '进阶挑战',
    difficulty: 2,
    isOpen: true,
    openTime: '2024-01-01T00:00:00Z',
    closeTime: '2025-12-31T23:59:59Z',
    description: '处理复杂的日历排程和多任务调度场景',
    reward: 200
  },
  {
    id: 'level-3',
    name: '精英考核',
    difficulty: 3,
    isOpen: false,
    openTime: '2024-06-01T00:00:00Z',
    closeTime: '2025-12-31T23:59:59Z',
    description: '高难度综合考核，检验全面的民宿运营能力',
    reward: 500
  }
]

function createEvidenceQuestions(levelId: string, levelIndex: number): Question {
  const multiplier = levelIndex + 1
  return {
    id: `q-${levelId}-evidence`,
    levelId,
    type: 'evidence',
    description: '在房间中找出所有保洁漏单的证据',
    score: 100 * multiplier,
    recommendedTime: 60 * multiplier,
    correctReason: '污渍、破损、异味和遗留物品都是保洁漏单的直接证据',
    evidences: [
      {
        id: `ev-${levelId}-1`,
        name: '床单污渍',
        description: '床单上可见明显的咖啡渍',
        isCorrect: true,
        position: { x: 0, y: 0.5, z: -1 }
      },
      {
        id: `ev-${levelId}-2`,
        name: '浴室毛发',
        description: '淋浴间地面有大量头发',
        isCorrect: true,
        position: { x: 2, y: 0, z: -1 }
      },
      {
        id: `ev-${levelId}-3`,
        name: '装饰品',
        description: '床头柜上的装饰花瓶',
        isCorrect: false,
        position: { x: -1.5, y: 0.8, z: -0.5 }
      },
      {
        id: `ev-${levelId}-4`,
        name: '垃圾桶未清空',
        description: '垃圾桶内有上一位客人的垃圾',
        isCorrect: true,
        position: { x: 1, y: 0.3, z: 1 }
      }
    ]
  }
}

function createTagQuestions(levelId: string, levelIndex: number): Question {
  const multiplier = levelIndex + 1
  const reviewTexts = [
    '房间整体还行，但是卫生间有股奇怪的味道，床单也感觉没换干净，枕头下面还有头发。前台服务倒是很好，位置也很便利。',
    '住了两晚，第二天回来发现垃圾没倒，地上有明显的灰尘脚印。早餐不错，但房间清洁确实需要加强，浴室玻璃有水渍。',
    '非常失望的体验！一进门就发现茶几上有上一位客人留下的零食包装袋，沙发缝隙里还有袜子。空调也坏了，报修后等了两个小时才有人来。强烈建议加强卫生管理和设施维护。'
  ]
  return {
    id: `q-${levelId}-tag`,
    levelId,
    type: 'tag',
    description: '根据住客点评，选择所有相关的保洁问题标签',
    score: 100 * multiplier,
    recommendedTime: 45 * multiplier,
    correctReason: '需要从点评中精准识别保洁相关问题，区分服务类和设施类问题',
    reviewText: reviewTexts[levelIndex] ?? reviewTexts[0],
    tagOptions: [
      { id: `tag-${levelId}-1`, label: '床单不洁', isCorrect: true },
      { id: `tag-${levelId}-2`, label: '卫生间异味', isCorrect: true },
      { id: `tag-${levelId}-3`, label: '垃圾未清', isCorrect: true },
      { id: `tag-${levelId}-4`, label: '服务态度差', isCorrect: false },
      { id: `tag-${levelId}-5`, label: '设施损坏', isCorrect: false },
      { id: `tag-${levelId}-6`, label: '毛发残留', isCorrect: true },
      { id: `tag-${levelId}-7`, label: '隔音不好', isCorrect: false },
      { id: `tag-${levelId}-8`, label: '地面灰尘', isCorrect: true }
    ]
  }
}

function createCalendarQuestions(levelId: string, levelIndex: number): Question {
  const multiplier = levelIndex + 1
  const baseDate = new Date('2024-06-15')
  const addHours = (h: number) => new Date(baseDate.getTime() + h * 3600000).toISOString()

  return {
    id: `q-${levelId}-calendar`,
    levelId,
    type: 'calendar',
    description: '合理安排保洁任务的执行顺序，确保时间和人员不冲突',
    score: 100 * multiplier,
    recommendedTime: 90 * multiplier,
    correctReason: '需要优先处理退房时间早、准备时间紧张的房间，同时避免同一保洁员任务时间重叠',
    calendarTasks: [
      {
        id: `ct-${levelId}-1`,
        roomId: 'A101',
        checkOut: addHours(8),
        nextCheckIn: addHours(14),
        priority: 1,
        requiredMinutes: 60,
        assignedTo: 'cleaner-1'
      },
      {
        id: `ct-${levelId}-2`,
        roomId: 'A102',
        checkOut: addHours(10),
        nextCheckIn: addHours(16),
        priority: 2,
        requiredMinutes: 45,
        assignedTo: 'cleaner-1'
      },
      {
        id: `ct-${levelId}-3`,
        roomId: 'B201',
        checkOut: addHours(9),
        nextCheckIn: addHours(13),
        priority: 1,
        requiredMinutes: 90,
        assignedTo: 'cleaner-2'
      },
      {
        id: `ct-${levelId}-4`,
        roomId: 'B202',
        checkOut: addHours(12),
        nextCheckIn: addHours(18),
        priority: 3,
        requiredMinutes: 60,
        assignedTo: 'cleaner-2'
      }
    ]
  }
}

function createTaskQuestions(levelId: string, levelIndex: number): Question {
  const multiplier = levelIndex + 1
  const baseDate = new Date('2024-06-15')
  const addHours = (h: number) => new Date(baseDate.getTime() + h * 3600000).toISOString()

  return {
    id: `q-${levelId}-task`,
    levelId,
    type: 'task',
    description: '分配保洁员处理以下任务，根据优先级和时限合理安排',
    score: 100 * multiplier,
    recommendedTime: 75 * multiplier,
    correctReason: '高优先级和紧急任务应分配给经验丰富的保洁员，并确保在截止时间前完成',
    cleaningTasks: [
      {
        id: `task-${levelId}-1`,
        roomId: 'VIP-001',
        type: 'turnover',
        priority: 1,
        deadline: addHours(14),
        assignedTo: ''
      },
      {
        id: `task-${levelId}-2`,
        roomId: 'A103',
        type: 'daily',
        priority: 2,
        deadline: addHours(17),
        assignedTo: ''
      },
      {
        id: `task-${levelId}-3`,
        roomId: 'B203',
        type: 'deep',
        priority: 3,
        deadline: addHours(20),
        assignedTo: ''
      },
      {
        id: `task-${levelId}-4`,
        roomId: 'C301',
        type: 'inspection',
        priority: 2,
        deadline: addHours(15),
        assignedTo: ''
      }
    ]
  }
}

export function createMockQuestions(): Question[] {
  const questions: Question[] = []
  mockLevels.forEach((level, index) => {
    questions.push(createEvidenceQuestions(level.id, index))
    questions.push(createTagQuestions(level.id, index))
    questions.push(createCalendarQuestions(level.id, index))
    questions.push(createTaskQuestions(level.id, index))
  })
  return questions
}

export const mockQuestions: Question[] = createMockQuestions()

export const mockUser: User = {
  id: 'user-001',
  name: '张小明',
  role: 'student',
  totalScore: 2350
}

function createQuestionResult(
  recordId: string,
  question: Question,
  isCorrect: boolean,
  timeSpent: number
): QuestionResult {
  return {
    id: `result-${recordId}-${question.id}`,
    recordId,
    questionId: question.id,
    type: question.type,
    isCorrect,
    timeSpent,
    recommendedTime: question.recommendedTime,
    hesitationPoints: isCorrect ? 0 : Math.floor(Math.random() * 3) + 1,
    userAnswer: isCorrect ? 'correct' : 'wrong'
  }
}

export function createMockRecords(): TrainingRecord[] {
  const records: TrainingRecord[] = []
  const levelQuestions = mockLevels.map((level) =>
    mockQuestions.filter((q) => q.levelId === level.id)
  )

  for (let i = 0; i < 10; i++) {
    const levelIndex = i % 3
    const level = mockLevels[levelIndex]
    const questions = levelQuestions[levelIndex]
    const recordId = `record-${i + 1}`
    const startTime = new Date(Date.now() - (i + 1) * 86400000)
    const endTime = new Date(startTime.getTime() + 30 * 60000)

    const results: QuestionResult[] = questions.map((q, qi) => {
      const isCorrect = Math.random() > 0.25
      const baseTime = q.recommendedTime
      const timeSpent = isCorrect
        ? Math.floor(baseTime * (0.6 + Math.random() * 0.5))
        : Math.floor(baseTime * (1 + Math.random()))
      return createQuestionResult(recordId, q, isCorrect, timeSpent)
    })

    const correctCount = results.filter((r) => r.isCorrect).length
    const onTimeCount = results.filter((r) => r.timeSpent <= r.recommendedTime).length
    const score = Math.floor((correctCount / questions.length) * 400 + level.reward * 0.5)

    records.push({
      id: recordId,
      userId: mockUser.id,
      levelId: level.id,
      score,
      onTimeRate: Math.round((onTimeCount / questions.length) * 100),
      status: correctCount >= questions.length * 0.6 ? 'completed' : 'failed',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      results
    })
  }

  return records
}

export const mockRecords: TrainingRecord[] = createMockRecords()

export const mockReplays: ReplayData[] = mockRecords
  .filter((r) => r.status === 'failed')
  .slice(0, 3)
  .map((record, index) => ({
    id: `replay-${index + 1}`,
    recordId: record.id,
    actionLog: Array.from({ length: 20 }, (_, i) => ({
      timestamp: i * 5000,
      actionType: ['select', 'hover', 'submit', 'drag'][i % 4],
      payload: { step: i }
    })),
    hesitationThreshold: 2000,
    createdAt: record.endTime
  }))

export const mockRewards: RewardItem[] = [
  { id: 'reward-1', type: 'points', threshold: 100, value: '新人积分' },
  { id: 'reward-2', type: 'points', threshold: 500, value: '达标积分' },
  { id: 'reward-3', type: 'points', threshold: 1000, value: '优秀积分' },
  { id: 'reward-4', type: 'badge', threshold: 5, value: '新手徽章' },
  { id: 'reward-5', type: 'badge', threshold: 20, value: '熟练徽章' },
  { id: 'reward-6', type: 'badge', threshold: 50, value: '专家徽章' },
  { id: 'reward-7', type: 'level', threshold: 0, value: '初级运营' },
  { id: 'reward-8', type: 'level', threshold: 2000, value: '中级运营' },
  { id: 'reward-9', type: 'level', threshold: 5000, value: '高级运营' }
]

export const mockSchedule: TimeSlot[] = [
  { id: 'slot-1', dayOfWeek: 'Monday', startTime: '09:00', endTime: '18:00', maxAttempts: 5 },
  { id: 'slot-2', dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '18:00', maxAttempts: 5 },
  { id: 'slot-3', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '18:00', maxAttempts: 5 },
  { id: 'slot-4', dayOfWeek: 'Thursday', startTime: '09:00', endTime: '18:00', maxAttempts: 5 },
  { id: 'slot-5', dayOfWeek: 'Friday', startTime: '09:00', endTime: '20:00', maxAttempts: 8 },
  { id: 'slot-6', dayOfWeek: 'Saturday', startTime: '10:00', endTime: '22:00', maxAttempts: 10 },
  { id: 'slot-7', dayOfWeek: 'Sunday', startTime: '10:00', endTime: '20:00', maxAttempts: 8 }
]

export const mockModes: ModeParam[] = [
  { id: 'mode-1', key: 'mode.campaign.name', value: '闯关模式' },
  { id: 'mode-2', key: 'mode.campaign.allowRetry', value: 'true' },
  { id: 'mode-3', key: 'mode.campaign.maxRetry', value: '3' },
  { id: 'mode-4', key: 'mode.practice.name', value: '自由练习' },
  { id: 'mode-5', key: 'mode.practice.unlimited', value: 'true' },
  { id: 'mode-6', key: 'mode.practice.showHint', value: 'true' },
  { id: 'mode-7', key: 'mode.exam.name', value: '模拟考核' },
  { id: 'mode-8', key: 'mode.exam.allowRetry', value: 'false' },
  { id: 'mode-9', key: 'mode.exam.timeLimit', value: '3600' }
]

export const mockConfig: ConfigBundle = {
  rewards: mockRewards,
  schedule: mockSchedule,
  modes: mockModes
}
