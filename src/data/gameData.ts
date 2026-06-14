import { Chapter, Player, TutorialStep, Question } from '../types';

const createQuestions = (chapterId: string): Question[] => {
  const questionBanks: Record<string, Question[]> = {
    'chapter-1': [
      {
        id: 'q1-1',
        type: 'single',
        title: '会员买了36节课，每周来2次，每次消耗1节课，能坚持多久？',
        description: '计算课程消耗周期',
        options: ['12周', '18周', '24周', '36周'],
        correctAnswer: 1,
        explanation: '36节课 ÷ 2节/周 = 18周',
        difficulty: 'easy',
        tags: ['计算', '课程消耗'],
        points: 10
      },
      {
        id: 'q1-2',
        type: 'single',
        title: '私教课程有效期通常是多久？',
        description: '了解行业常规',
        options: ['3个月', '6个月', '12个月', '24个月'],
        correctAnswer: 2,
        explanation: '大多数健身房私教课程有效期为12个月',
        difficulty: 'easy',
        tags: ['行业知识', '有效期'],
        points: 10
      },
      {
        id: 'q1-3',
        type: 'multiple',
        title: '影响课程消耗速度的因素有哪些？',
        description: '多选：找出所有正确因素',
        options: ['会员出勤率', '课程频率', '教练排班', '健身房装修'],
        correctAnswer: [0, 1, 2],
        explanation: '会员出勤率、课程频率、教练排班都会直接影响课程消耗速度',
        difficulty: 'medium',
        tags: ['影响因素', '课程消耗'],
        points: 20
      }
    ],
    'chapter-2': [
      {
        id: 'q2-1',
        type: 'single',
        title: '会员周一、三、五训练，每次1节课，24节课能用多久？',
        description: '计算每周3次的消耗周期',
        options: ['4周', '6周', '8周', '12周'],
        correctAnswer: 2,
        explanation: '24节课 ÷ 3节/周 = 8周',
        difficulty: 'easy',
        tags: ['计算', '周训练计划'],
        points: 10
      },
      {
        id: 'q2-2',
        type: 'schedule',
        title: '请为会员安排本周训练：每周2次，间隔至少1天',
        description: '选择合理的训练日',
        options: ['周一和周二', '周一和周三', '周一和周日', '周二和周四'],
        correctAnswer: [1, 3],
        explanation: '周一和周三间隔2天，周二和周四周间隔2天，都符合间隔至少1天的要求',
        difficulty: 'medium',
        tags: ['排课', '训练间隔'],
        points: 20
      },
      {
        id: 'q2-3',
        type: 'single',
        title: '课程消耗预警线一般设置为剩余课程的多少？',
        description: '了解续费提醒时机',
        options: ['剩余30%', '剩余50%', '剩余70%', '剩余90%'],
        correctAnswer: 0,
        explanation: '行业常规是剩余30%时开始提醒续费',
        difficulty: 'medium',
        tags: ['预警', '续费提醒'],
        points: 15
      }
    ],
    'chapter-3': [
      {
        id: 'q3-1',
        type: 'single',
        title: '会员有48节课，想在16周内上完，每周需要来几次？',
        description: '反向计算训练频率',
        options: ['2次', '3次', '4次', '5次'],
        correctAnswer: 1,
        explanation: '48节课 ÷ 16周 = 3节/周',
        difficulty: 'medium',
        tags: ['计算', '反向推导'],
        points: 15
      },
      {
        id: 'q3-2',
        type: 'multiple',
        title: '会员请假时，正确的处理方式是？',
        description: '多选：找出正确的处理方式',
        options: ['直接扣除课时', '记录请假并延后课程', '提醒会员补课', '直接删除课程记录'],
        correctAnswer: [1, 2],
        explanation: '会员请假应该记录并延后课程，同时提醒会员安排补课',
        difficulty: 'medium',
        tags: ['请假处理', '客户服务'],
        points: 20
      },
      {
        id: 'q3-3',
        type: 'single',
        title: '某会员10节课用了5周，按照这个速度，30节课需要多久？',
        description: '按比例计算',
        options: ['10周', '12周', '15周', '20周'],
        correctAnswer: 2,
        explanation: '10节/5周 = 2节/周，30节 ÷ 2节/周 = 15周',
        difficulty: 'hard',
        tags: ['计算', '比例推算'],
        points: 25
      }
    ],
    'chapter-4': [
      {
        id: 'q4-1',
        type: 'schedule',
        title: '为增肌会员安排训练频率，最佳方案是？',
        description: '选择科学的训练频率',
        options: ['每周1次', '每周2-3次', '每周5-6次', '每天都练'],
        correctAnswer: 1,
        explanation: '增肌训练最佳频率是每周2-3次，给肌肉足够恢复时间',
        difficulty: 'medium',
        tags: ['训练计划', '增肌'],
        points: 20
      },
      {
        id: 'q4-2',
        type: 'single',
        title: '课程消耗追踪系统中，最重要的指标是？',
        description: '理解核心指标',
        options: ['课程单价', '消耗速度', '教练姓名', '健身房地址'],
        correctAnswer: 1,
        explanation: '消耗速度直接关系到续费周期和会员留存',
        difficulty: 'medium',
        tags: ['指标', '追踪系统'],
        points: 15
      },
      {
        id: 'q4-3',
        type: 'multiple',
        title: '提高课程消耗率的有效方法有哪些？',
        description: '多选：找出有效方法',
        options: ['固定训练时间', '多样化训练内容', '不提醒会员上课', '设置阶段性目标'],
        correctAnswer: [0, 1, 3],
        explanation: '固定训练时间、多样化内容、设置目标都能提高出勤率和消耗率',
        difficulty: 'hard',
        tags: ['策略', '提高消耗'],
        points: 25
      }
    ],
    'chapter-5': [
      {
        id: 'q5-1',
        type: 'single',
        title: '会员剩余5节课，距离有效期还有2个月，最佳处理方式是？',
        description: '临期课程处理',
        options: ['等会员自己想起来', '建议集中训练并推荐续课', '直接作废', '不管不问'],
        correctAnswer: 1,
        explanation: '应该主动联系会员，建议集中训练并推荐续课',
        difficulty: 'hard',
        tags: ['临期处理', '客户服务'],
        points: 25
      },
      {
        id: 'q5-2',
        type: 'single',
        title: '综合挑战：会员60节课，有效期12个月，每月至少消耗多少节才能用完？',
        description: '月度消耗计算',
        options: ['3节', '4节', '5节', '6节'],
        correctAnswer: 2,
        explanation: '60节 ÷ 12月 = 5节/月',
        difficulty: 'hard',
        tags: ['综合计算', '月度目标'],
        points: 30
      },
      {
        id: 'q5-3',
        type: 'multiple',
        title: '建立会员信任的方法包括？',
        description: '多选：建立长期信任',
        options: ['持续追踪训练效果', '及时沟通课程消耗', '只在续费时联系', '专业的训练指导'],
        correctAnswer: [0, 1, 3],
        explanation: '持续追踪、及时沟通、专业指导都能建立信任，只在续费时联系会引起反感',
        difficulty: 'hard',
        tags: ['客户关系', '信任建立'],
        points: 30
      }
    ]
  };

  return questionBanks[chapterId] || [];
};

const createAssignments = (chapterId: string) => {
  const questions = createQuestions(chapterId);
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  return [
    {
      id: `${chapterId}-assignment-1`,
      title: '基础训练',
      description: '完成本章基础题目',
      questions: questions.slice(0, 2),
      completed: false,
      score: 0,
      totalPoints: questions.slice(0, 2).reduce((sum, q) => sum + q.points, 0)
    },
    {
      id: `${chapterId}-assignment-2`,
      title: '进阶挑战',
      description: '完成本章进阶题目',
      questions: questions.slice(2),
      completed: false,
      score: 0,
      totalPoints: questions.slice(2).reduce((sum, q) => sum + q.points, 0)
    }
  ];
};

export const chapters: Chapter[] = [
  {
    id: 'chapter-1',
    title: '课程消耗入门',
    description: '了解课程消耗的基本概念和计算方法',
    icon: 'BookOpen',
    color: '#3b82f6',
    unlocked: true,
    completed: false,
    assignments: createAssignments('chapter-1'),
    progress: 0,
    order: 1
  },
  {
    id: 'chapter-2',
    title: '排课策略',
    description: '学习合理安排训练计划和课程消耗节奏',
    icon: 'Calendar',
    color: '#10b981',
    unlocked: false,
    completed: false,
    assignments: createAssignments('chapter-2'),
    progress: 0,
    order: 2
  },
  {
    id: 'chapter-3',
    title: '消耗速度计算',
    description: '掌握各种复杂场景下的课程消耗计算',
    icon: 'Calculator',
    color: '#f59e0b',
    unlocked: false,
    completed: false,
    assignments: createAssignments('chapter-3'),
    progress: 0,
    order: 3
  },
  {
    id: 'chapter-4',
    title: '会员管理',
    description: '学习如何管理不同类型会员的课程消耗',
    icon: 'Users',
    color: '#8b5cf6',
    unlocked: false,
    completed: false,
    assignments: createAssignments('chapter-4'),
    progress: 0,
    order: 4
  },
  {
    id: 'chapter-5',
    title: '综合实战',
    description: '综合运用所学知识解决实际问题',
    icon: 'Trophy',
    color: '#ef4444',
    unlocked: false,
    completed: false,
    assignments: createAssignments('chapter-5'),
    progress: 0,
    order: 5
  }
];

export const players: Player[] = [
  { id: '1', name: '王教练', avatar: '👨‍🏫', totalScore: 850, completionRate: 92, totalTime: 1250, level: 8 },
  { id: '2', name: '李教练', avatar: '👩‍🏫', totalScore: 780, completionRate: 88, totalTime: 1420, level: 7 },
  { id: '3', name: '张教练', avatar: '🧑‍🏫', totalScore: 720, completionRate: 85, totalTime: 1180, level: 6 },
  { id: '4', name: '刘教练', avatar: '👨‍💼', totalScore: 650, completionRate: 78, totalTime: 1650, level: 5 },
  { id: '5', name: '陈教练', avatar: '👩‍💼', totalScore: 580, completionRate: 72, totalTime: 1820, level: 4 },
  { id: '6', name: '赵教练', avatar: '🧑‍💼', totalScore: 520, completionRate: 68, totalTime: 2100, level: 3 },
  { id: '7', name: '孙教练', avatar: '👨‍🎓', totalScore: 450, completionRate: 62, totalTime: 2400, level: 3 },
  { id: '8', name: '周教练', avatar: '👩‍🎓', totalScore: 380, completionRate: 55, totalTime: 2800, level: 2 },
  { id: 'player', name: '你', avatar: '🏋️', totalScore: 0, completionRate: 0, totalTime: 0, level: 1 }
];

export const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: '欢迎来到健身私教课程消耗调度解谜游戏！',
    description: '在这里你将学习如何管理私教课程消耗，成为优秀的健身教练！',
    target: 'menu'
  },
  {
    id: 1,
    title: '课程章节',
    description: '点击下方的课程章节卡片开始学习。每个章节包含不同的知识点。',
    target: 'chapters',
    chapterId: 'chapter-1'
  },
  {
    id: 2,
    title: '作业任务',
    description: '每个章节有多个作业任务，完成作业可以获得积分和经验。',
    target: 'assignments',
    chapterId: 'chapter-1'
  },
  {
    id: 3,
    title: '答题挑战',
    description: '仔细阅读题目，选择正确答案。答题后会立即告诉你结果和解析。',
    target: 'question',
    chapterId: 'chapter-1'
  },
  {
    id: 4,
    title: '排行榜',
    description: '排行榜按完成率和完成时间分开排名，不只奖励速度哦！',
    target: 'leaderboard'
  },
  {
    id: 5,
    title: '统计页面',
    description: '在统计页面可以查看各章节完成率，比较训练差异。',
    target: 'stats'
  },
  {
    id: 6,
    title: '开始冒险！',
    description: '你已经准备好了！点击"课程消耗入门"开始你的第一个章节吧！',
    target: 'start'
  }
];
