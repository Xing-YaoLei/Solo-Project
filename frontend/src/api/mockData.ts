import type {
  Event,
  TicketType,
  Order,
  VerificationTicket,
  VerificationAction,
  EfficiencyStats,
  SourceGroupStats,
  AssigneeGroupStats,
  ConclusionGroupStats,
  SeatingChart,
  SeatChartItem,
} from '../types'

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString()

export const mockEvents: Event[] = [
  {
    id: 'evt-001',
    name: '2026夏季音乐节',
    venue: '城市体育馆',
    event_date: '2026-08-15T19:00:00Z',
    status: 'ongoing',
    created_at: hoursAgo(720),
    updated_at: hoursAgo(48),
  },
  {
    id: 'evt-002',
    name: '年度技术峰会',
    venue: '国际会议中心',
    event_date: '2026-09-20T09:00:00Z',
    status: 'scheduled',
    created_at: hoursAgo(360),
    updated_at: hoursAgo(120),
  },
]

export const mockTicketTypes: TicketType[] = [
  {
    id: 'tt-vip',
    event_id: 'evt-001',
    name: 'VIP',
    price: 1280,
    quota: 100,
    sold_count: 67,
    rules: { max_per_order: 4, entry_time: '18:00', includes: ['前排座位', '签名会', '纪念礼包'] },
    status: 'active',
    created_at: hoursAgo(700),
    updated_at: hoursAgo(24),
  },
  {
    id: 'tt-std',
    event_id: 'evt-001',
    name: '标准票',
    price: 580,
    quota: 500,
    sold_count: 342,
    rules: { max_per_order: 6, entry_time: '19:00' },
    status: 'active',
    created_at: hoursAgo(700),
    updated_at: hoursAgo(24),
  },
  {
    id: 'tt-stu',
    event_id: 'evt-001',
    name: '学生票',
    price: 280,
    quota: 200,
    sold_count: 198,
    rules: { max_per_order: 1, entry_time: '19:00', requires_student_id: true },
    status: 'sold_out',
    created_at: hoursAgo(700),
    updated_at: hoursAgo(24),
  },
]

const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二']
const sources: string[] = ['online', 'offline', 'import', 'manual']
const statuses = ['pending', 'in_progress', 'disputed', 'supplementing', 'escalated', 'closed_normal', 'closed_dispute']
const assignees = ['张核销', '李核销', '王核销', '赵主管']

export const mockOrders: Order[] = Array.from({ length: 10 }).map((_, i) => {
  const tt = mockTicketTypes[i % 3]
  const qty = 1 + (i % 3)
  return {
    id: `ord-${1000 + i}`,
    event_id: 'evt-001',
    ticket_type_id: tt.id,
    order_no: `ORD-2026-${1001 + i}`,
    buyer_name: names[i],
    buyer_phone: `1380000${1001 + i}`,
    buyer_email: i % 2 === 0 ? `${names[i]}@example.com` : null,
    quantity: qty,
    total_amount: Number((tt.price * qty).toFixed(2)),
    status: ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'disputed', 'paid', 'pending_payment', 'paid'][i],
    source: sources[i % 4],
    source_reference: `SRC-${2001 + i}`,
    created_at: hoursAgo(300 - i * 8),
    updated_at: hoursAgo(48 - i),
  }
})

function mkActions(vfIdx: number): VerificationAction[] {
  const transitions: [string, string, string][] = [
    ['pending', 'in_progress', 'start'],
    ['in_progress', 'disputed', 'raise_dispute'],
    ['disputed', 'supplementing', 'require_supplement'],
    ['supplementing', 'disputed', 'resume_dispute'],
    ['disputed', 'escalated', 'escalate'],
    ['escalated', 'closed_dispute', 'close_dispute'],
  ]
  const count = Math.min(vfIdx + 2, transitions.length)
  return transitions.slice(0, count).map(([from, to, action], j) => ({
    id: `act-${vfIdx}-${j}`,
    verification_id: `vf-${vfIdx}`,
    from_status: from,
    to_status: to,
    action,
    operator: assignees[(vfIdx + j) % assignees.length],
    note: ['开始现场核销', '观众反映座位与票面不符，要求退票', '请补充购票凭证和现场照片', '已上传凭证，继续争议处理', '协商未果，转交运营总监', '双方同意按 70% 退款处理'][j] || null,
    created_at: hoursAgo(72 - vfIdx * 6 - j * 2),
  }))
}

export const mockVerifications: VerificationTicket[] = statuses.map((st, i) => ({
  id: `vf-${i}`,
  ticket_no: `VF-2026-${3001 + i}`,
  event_id: 'evt-001',
  order_id: mockOrders[i].id,
  seat_id: i % 2 === 0 ? 'seat-a3-12' : null,
  ticket_type_id: mockTicketTypes[i % 3].id,
  status: st as any,
  assignee: assignees[i % assignees.length],
  source: sources[i % 4],
  source_reference: `REF-${4001 + i}`,
  verification_code: `VC${5001 + i}AB`,
  verified_at: i >= 1 ? hoursAgo(48 + i) : null,
  closed_at: i >= 5 ? hoursAgo(12 + i) : null,
  conclusion: i === 5 ? '正常完成核销，已入场' : i === 6 ? '按 70% 退款处理，双方同意' : null,
  dispute_reason: i >= 2 && i <= 4 ? '观众称座位区域与票面描述不符，要求全额退票，现场协调无果' : null,
  supplement_note: i === 3 ? '已补充购票截图、座位照片、现场视频' : null,
  escalation_target: i === 4 ? '运营总监-周经理' : null,
  created_at: hoursAgo(96 + i),
  updated_at: hoursAgo(6 + i),
  event: mockEvents[0],
  ticket_type: mockTicketTypes[i % 3],
  order: mockOrders[i],
  seat: i % 2 === 0
    ? {
        id: 'seat-a3-12',
        event_id: 'evt-001',
        section: 'A区',
        row: '3',
        number: '12',
        seat_label: 'A区-3排-12号',
        status: 'occupied',
        order_id: mockOrders[i].id,
        ticket_type_id: mockTicketTypes[i % 3].id,
        created_at: hoursAgo(300),
        updated_at: hoursAgo(96),
      }
    : undefined,
  actions: mkActions(i),
}))

export const mockEfficiency: EfficiencyStats = {
  total: mockVerifications.length,
  verified: 3,
  avg_time_hours: 4.7,
  efficiency_rate: 42.9,
}

export const mockSourceStats: SourceGroupStats[] = sources.map((src) => ({
  source: src,
  count: mockVerifications.filter((v) => v.source === src).length || 2,
  closed_count: mockVerifications.filter((v) => v.source === src && v.status.startsWith('closed')).length || 1,
  disputed_count: mockVerifications.filter((v) => v.source === src && (v.status === 'disputed' || v.status === 'closed_dispute')).length || 1,
}))

export const mockAssigneeStats: AssigneeGroupStats[] = assignees.map((a, idx) => ({
  assignee: a,
  count: 2 + idx,
  closed_count: idx >= 2 ? 1 + idx : idx,
  avg_time_hours: [3.2, 5.8, 4.1, 6.5][idx],
}))

export const mockConclusionStats: ConclusionGroupStats[] = [
  { conclusion: 'closed_normal', count: mockVerifications.filter((v) => v.status === 'closed_normal').length },
  { conclusion: 'closed_dispute', count: mockVerifications.filter((v) => v.status === 'closed_dispute').length },
  { conclusion: 'none', count: mockVerifications.filter((v) => !v.status.startsWith('closed')).length },
]

function buildSeatingChart(eventId: string): SeatingChart {
  const sections = ['A区', 'B区', 'C区']
  const seatStatuses = ['available', 'reserved', 'occupied', 'disabled'] as const
  const chart: Record<string, Record<string, SeatChartItem[]>> = {}

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si]
    chart[section] = {}
    for (let r = 1; r <= 5; r++) {
      const rowKey = `${r}排`
      chart[section][rowKey] = []
      for (let n = 1; n <= 10; n++) {
        const idx = si * 50 + (r - 1) * 10 + n
        let status: typeof seatStatuses[number] = 'available'
        if (idx <= 30) status = 'occupied'
        else if (idx <= 60) status = 'reserved'
        else if (n === 5 || n === 6) status = 'disabled'
        const orderIdx = (idx - 1) % mockOrders.length
        chart[section][rowKey].push({
          id: `seat-${section}-${r}-${n}`,
          number: String(n),
          seat_label: `${section}-${r}排-${n}号`,
          status,
          order_id: status === 'occupied' || status === 'reserved' ? mockOrders[orderIdx].id : null,
          ticket_type_id: mockTicketTypes[si % 3].id,
        })
      }
    }
  }
  return { event_id: eventId, chart }
}

export const mockSeatingChart = buildSeatingChart('evt-001')
