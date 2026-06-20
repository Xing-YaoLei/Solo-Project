import type { HeatPoint, GuideRoute, SeatAssignment, PerformanceTask, LeaderboardEntry, TutorialStep } from '@/types'

export const heatPoints: HeatPoint[] = [
  { id: 'hp1', position: [-4, 0.1, -3], name: '云顶索道站', visitorCount: 842, waitTime: 25, secondarySpendPotential: 0.72, heatLevel: 'critical' },
  { id: 'hp2', position: [3, 0.1, -4], name: '翠湖观景台', visitorCount: 563, waitTime: 15, secondarySpendPotential: 0.58, heatLevel: 'high' },
  { id: 'hp3', position: [5, 0.1, 2], name: '古街美食区', visitorCount: 1205, waitTime: 8, secondarySpendPotential: 0.91, heatLevel: 'critical' },
  { id: 'hp4', position: [-2, 0.1, 4], name: '瀑布步道入口', visitorCount: 387, waitTime: 12, secondarySpendPotential: 0.34, heatLevel: 'medium' },
  { id: 'hp5', position: [0, 0.1, 6], name: '演艺中心广场', visitorCount: 956, waitTime: 20, secondarySpendPotential: 0.83, heatLevel: 'high' },
  { id: 'hp6', position: [-5, 0.1, 1], name: '禅茶体验馆', visitorCount: 215, waitTime: 5, secondarySpendPotential: 0.65, heatLevel: 'low' },
]

export const guideRoutes: GuideRoute[] = [
  {
    id: 'route1',
    name: '经典环线',
    duration: 120,
    attractions: ['云顶索道站', '翠湖观景台', '古街美食区', '瀑布步道入口'],
    secondarySpendRate: 0.62,
    riskLevel: 'safe',
    nodePositions: [[-4, 0.5, -3], [3, 0.5, -4], [5, 0.5, 2], [-2, 0.5, 4]],
  },
  {
    id: 'route2',
    name: '美食直达线',
    duration: 75,
    attractions: ['云顶索道站', '古街美食区', '演艺中心广场'],
    secondarySpendRate: 0.85,
    riskLevel: 'moderate',
    nodePositions: [[-4, 0.5, -3], [5, 0.5, 2], [0, 0.5, 6]],
  },
  {
    id: 'route3',
    name: '深度体验线',
    duration: 180,
    attractions: ['禅茶体验馆', '瀑布步道入口', '翠湖观景台', '古街美食区', '演艺中心广场'],
    secondarySpendRate: 0.74,
    riskLevel: 'high',
    nodePositions: [[-5, 0.5, 1], [-2, 0.5, 4], [3, 0.5, -4], [5, 0.5, 2], [0, 0.5, 6]],
  },
  {
    id: 'route4',
    name: '速览精华线',
    duration: 50,
    attractions: ['翠湖观景台', '古街美食区'],
    secondarySpendRate: 0.48,
    riskLevel: 'safe',
    nodePositions: [[3, 0.5, -4], [5, 0.5, 2]],
  },
]

function generateSeats(): SeatAssignment[] {
  const seats: SeatAssignment[] = []
  const rows = 5
  const cols = 8
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const grade = r === 0 ? 'VIP' : r === 1 ? 'A' : r === 2 ? 'B' : 'C'
      const price = grade === 'VIP' ? 280 : grade === 'A' ? 180 : grade === 'B' ? 120 : 80
      const viewScore = grade === 'VIP' ? 95 : grade === 'A' ? 82 : grade === 'B' ? 68 : 55
      seats.push({
        seatId: `seat-${r}-${c}`,
        grade,
        price,
        viewScore,
        assigned: false,
        conflict: false,
        row: r,
        col: c,
      })
    }
  }
  return seats
}

export const performanceTask: PerformanceTask = {
  id: 'perf1',
  name: '山水实景演出',
  totalSeats: 40,
  seats: generateSeats(),
  satisfactionScore: 0,
  revenue: 0,
}

export const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, playerName: '运营达人', secondarySpendRate: 0.92, completionTime: 85, accuracy: 96 },
  { rank: 2, playerName: '景区老兵', secondarySpendRate: 0.88, completionTime: 92, accuracy: 91 },
  { rank: 3, playerName: '路线规划师', secondarySpendRate: 0.85, completionTime: 78, accuracy: 88 },
  { rank: 4, playerName: '导览小能手', secondarySpendRate: 0.82, completionTime: 105, accuracy: 85 },
  { rank: 5, playerName: '新锐调度员', secondarySpendRate: 0.79, completionTime: 95, accuracy: 82 },
  { rank: 6, playerName: '景区新秀', secondarySpendRate: 0.76, completionTime: 112, accuracy: 79 },
  { rank: 7, playerName: '运营实习生', secondarySpendRate: 0.72, completionTime: 130, accuracy: 75 },
  { rank: 8, playerName: '实习调度员', secondarySpendRate: 0.68, completionTime: 145, accuracy: 71 },
  { rank: 9, playerName: '见习管理员', secondarySpendRate: 0.63, completionTime: 158, accuracy: 66 },
  { rank: 10, playerName: '初入景区', secondarySpendRate: 0.55, completionTime: 175, accuracy: 58 },
]

export const tutorialSteps: TutorialStep[] = [
  { id: 't1', title: '认识热力点位', description: '场景中发光的标记就是热力点位，它们代表景区中的关键区域。颜色从绿到红表示客流量和二消潜力的高低。', targetElement: 'heat-point' },
  { id: 't2', title: '阅读热力卡片', description: '点击热力点位可以查看详细数据卡片，包括客流量、等待时长和二消潜力。这些数据是你做决策的关键依据。', targetElement: 'heat-card' },
  { id: 't3', title: '选择导览路线', description: '根据热力数据，在左侧面板中选择最适合当前客流状况的导览路线。注意平衡二消转化率和运营风险。', targetElement: 'route-panel' },
  { id: 't4', title: '安排演出座位', description: '在右侧面板中为游客分配演出座位。不同等级的座位价格和视野评分不同，合理分配能提升满意度。', targetElement: 'seat-panel' },
  { id: 't5', title: '提交决策获取反馈', description: '确认路线和座位安排后提交决策，系统将给出即时反馈评分，帮助你理解每个决策的影响。', targetElement: 'submit-btn' },
]

export const HEAT_COLORS = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
} as const

export const GRADE_COLORS = {
  VIP: '#F5C542',
  A: '#FF6B35',
  B: '#3b82f6',
  C: '#6b7280',
} as const
