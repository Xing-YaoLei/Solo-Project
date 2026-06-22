export const levels = [
  {
    id: 1,
    name: '初识排期',
    difficulty: '简单',
    description: '学习基本的开庭日历排期规则',
    timeSlots: [
      { id: 't1', time: '09:00', duration: 2, maxCapacity: 1 },
      { id: 't2', time: '11:00', duration: 2, maxCapacity: 1 },
      { id: 't3', time: '14:00', duration: 2, maxCapacity: 1 },
      { id: 't4', time: '16:00', duration: 2, maxCapacity: 1 },
    ],
    cases: [
      { id: 'c1', name: '合同纠纷案', client: '张三', priority: 2, duration: 2, preferredSlot: 't1' },
      { id: 'c2', name: '侵权责任案', client: '李四', priority: 1, duration: 2, preferredSlot: 't3' },
      { id: 'c3', name: '劳动争议案', client: '王五', priority: 3, duration: 2, preferredSlot: 't2' },
    ],
    targetSatisfaction: 70,
    targetTime: 60,
    tutorial: [
      {
        title: '欢迎来到开庭日历调度',
        content: '你将扮演一位法律服务调度员，负责将案件安排到合适的开庭时段。',
        tips: ['目标：在有限时间内完成所有案件排期', '注意：每个时段有容量限制', '奖励：客户满意度越高，得分越高']
      },
      {
        title: '日历时段卡片',
        content: '每个蓝色方块代表一个开庭时段，上面显示时间和容量。',
        tips: ['点击时段卡片可以查看详情', '绿色表示正常，黄色表示接近满载', '红色表示已满或冲突']
      },
      {
        title: '案件与冲突检测',
        content: '将案件拖放到时段上完成排期，系统会自动检测冲突。',
        tips: ['冲突：同一时段案件数超过容量', '满意：案件被安排在偏好时段', '提示：优先安排高优先级案件']
      },
      {
        title: '准备开始',
        content: '第一关是入门训练，你有60秒完成3个案件的排期。',
        tips: ['点击"开始"按钮进入游戏', '随时可以重置关卡重新尝试', '完成后可以查看统计数据']
      }
    ]
  },
  {
    id: 2,
    name: '容量挑战',
    difficulty: '中等',
    description: '管理多个时段的容量分配',
    timeSlots: [
      { id: 't1', time: '09:00', duration: 2, maxCapacity: 2 },
      { id: 't2', time: '11:00', duration: 2, maxCapacity: 1 },
      { id: 't3', time: '14:00', duration: 2, maxCapacity: 2 },
      { id: 't4', time: '16:00', duration: 2, maxCapacity: 1 },
    ],
    cases: [
      { id: 'c1', name: '房产纠纷案', client: '赵六', priority: 2, duration: 2, preferredSlot: 't1' },
      { id: 'c2', name: '债务纠纷案', client: '钱七', priority: 1, duration: 2, preferredSlot: 't1' },
      { id: 'c3', name: '知识产权案', client: '孙八', priority: 3, duration: 2, preferredSlot: 't3' },
      { id: 'c4', name: '婚姻家庭案', client: '周九', priority: 2, duration: 2, preferredSlot: 't2' },
      { id: 'c5', name: '交通事故案', client: '吴十', priority: 1, duration: 2, preferredSlot: 't4' },
    ],
    targetSatisfaction: 75,
    targetTime: 90,
    tutorial: null
  },
  {
    id: 3,
    name: '复杂冲突',
    difficulty: '困难',
    description: '处理复杂的时间冲突和优先级',
    timeSlots: [
      { id: 't1', time: '08:30', duration: 1.5, maxCapacity: 2 },
      { id: 't2', time: '10:30', duration: 1.5, maxCapacity: 1 },
      { id: 't3', time: '13:30', duration: 2, maxCapacity: 3 },
      { id: 't4', time: '16:00', duration: 1.5, maxCapacity: 2 },
    ],
    cases: [
      { id: 'c1', name: '刑事辩护案', client: '郑甲', priority: 1, duration: 1.5, preferredSlot: 't2' },
      { id: 'c2', name: '行政诉讼案', client: '王乙', priority: 2, duration: 2, preferredSlot: 't3' },
      { id: 'c3', name: '合同纠纷案', client: '李丙', priority: 3, duration: 1.5, preferredSlot: 't1' },
      { id: 'c4', name: '劳动争议案', client: '张丁', priority: 2, duration: 1.5, preferredSlot: 't1' },
      { id: 'c5', name: '侵权责任案', client: '刘戊', priority: 1, duration: 2, preferredSlot: 't3' },
      { id: 'c6', name: '遗产纠纷案', client: '陈己', priority: 3, duration: 1.5, preferredSlot: 't4' },
      { id: 'c7', name: '消费维权案', client: '杨庚', priority: 2, duration: 1.5, preferredSlot: 't4' },
    ],
    targetSatisfaction: 80,
    targetTime: 120,
    tutorial: null
  },
  {
    id: 4,
    name: '终极考验',
    difficulty: '专家',
    description: '全方位考验你的调度能力',
    timeSlots: [
      { id: 't1', time: '08:00', duration: 2, maxCapacity: 2 },
      { id: 't2', time: '10:30', duration: 1.5, maxCapacity: 2 },
      { id: 't3', time: '13:00', duration: 2, maxCapacity: 3 },
      { id: 't4', time: '15:30', duration: 1.5, maxCapacity: 2 },
      { id: 't5', time: '17:30', duration: 1, maxCapacity: 1 },
    ],
    cases: [
      { id: 'c1', name: '重大刑事案', client: 'A先生', priority: 1, duration: 2, preferredSlot: 't1' },
      { id: 'c2', name: '上市公司案', client: 'B公司', priority: 1, duration: 1.5, preferredSlot: 't2' },
      { id: 'c3', name: '集团诉讼案', client: 'C集团', priority: 2, duration: 2, preferredSlot: 't3' },
      { id: 'c4', name: '专利侵权案', client: 'D先生', priority: 2, duration: 1.5, preferredSlot: 't2' },
      { id: 'c5', name: '医疗纠纷案', client: 'E女士', priority: 1, duration: 2, preferredSlot: 't3' },
      { id: 'c6', name: '建设工程案', client: 'F公司', priority: 3, duration: 1.5, preferredSlot: 't4' },
      { id: 'c7', name: '金融借款案', client: 'G银行', priority: 2, duration: 1, preferredSlot: 't5' },
      { id: 'c8', name: '租赁合同案', client: 'H先生', priority: 3, duration: 1.5, preferredSlot: 't4' },
      { id: 'c9', name: '保险理赔案', client: 'I女士', priority: 2, duration: 1, preferredSlot: 't5' },
    ],
    targetSatisfaction: 85,
    targetTime: 150,
    tutorial: null
  }
];

export const mockLeaderboard = {
  satisfaction: [
    { rank: 1, name: '法律精英', score: 98 },
    { rank: 2, name: '排期大师', score: 95 },
    { rank: 3, name: '调度专家', score: 92 },
    { rank: 4, name: '律政先锋', score: 88 },
    { rank: 5, name: '正义使者', score: 85 },
    { rank: 6, name: '法务高手', score: 82 },
    { rank: 7, name: '天平守护者', score: 79 },
    { rank: 8, name: '法理达人', score: 76 },
    { rank: 9, name: '诉讼能手', score: 73 },
    { rank: 10, name: '新手律师', score: 70 },
  ],
  time: [
    { rank: 1, name: '闪电调度', score: 28 },
    { rank: 2, name: '快手法务', score: 35 },
    { rank: 3, name: '效率之星', score: 42 },
    { rank: 4, name: '时间管理', score: 48 },
    { rank: 5, name: '雷厉风行', score: 55 },
    { rank: 6, name: '稳步前进', score: 62 },
    { rank: 7, name: '稳扎稳打', score: 70 },
    { rank: 8, name: '循序渐进', score: 78 },
    { rank: 9, name: '厚积薄发', score: 85 },
    { rank: 10, name: '初来乍到', score: 95 },
  ]
};
