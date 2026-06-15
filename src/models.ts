import type {
  Homework,
  Chapter,
  GradeFeedback,
  ReminderRule,
  ChoiceResult,
  FailureRecord,
  ReplaySnapshot,
  GameStats
} from './types';

const GRADE_LABELS: Record<GradeFeedback, string> = {
  excellent: '优秀',
  good: '良好',
  pass: '及格',
  fail: '不及格'
};

const RULE_LABELS: Record<ReminderRule, string> = {
  deadline: '临近截止提醒',
  retry: '需要重做',
  plagiarism: '疑似抄袭',
  late: '迟交警告'
};

const STUDENT_NAMES = [
  '小明', '小红', '小刚', '小丽', '小华',
  '小强', '小芳', '小军', '小燕', '小龙'
];

const GRADE_SCORE_RANGES: Record<GradeFeedback, [number, number]> = {
  excellent: [90, 100],
  good: [75, 89],
  pass: [60, 74],
  fail: [30, 59]
};

const GRADE_QUALITY_POOLS: Record<GradeFeedback, string[]> = {
  excellent: [
    '全部题目解答完整',
    '解题步骤详细清晰',
    '附加题完成并有延伸思考',
    '多处运用简便方法',
    '无计算错误',
    '格式规范字迹工整'
  ],
  good: [
    '大部分题目解答完整',
    '偶有轻微跳步但思路清晰',
    '基础题全部做对',
    '难题部分得分',
    '1-2 处小计算错误',
    '字迹较工整'
  ],
  pass: [
    '基础题得分率约六成',
    '多处解题步骤不完整',
    '部分题目留空',
    '3-5 处计算或概念错误',
    '字迹潦草辨认困难',
    '难题未作答'
  ],
  fail: [
    '大量题目留空未做',
    '基础题错误率极高',
    '解题思路完全偏离',
    '5 处以上严重错误',
    '仅完成选择题部分',
    '卷面空白较多'
  ]
};

const CHAPTER_CLUE_POOLS: Record<string, string[]> = {
  ch1: [
    '解一元一次方程 3x + 7 = 22',
    '化简代数式: 2(a - b) + 3(a + b)',
    '应用题：用方程求未知数',
    '有理数混合运算',
    '因式分解 2x² - 8x',
    '求值：当 x=3 时 4x-5 的值'
  ],
  ch2: [
    '求三角形面积（底8高5）',
    '四边形周长与面积计算',
    '平行线与同位角证明',
    '勾股定理应用',
    '圆的周长与面积',
    '图形的平移与旋转'
  ],
  ch3: [
    '一次函数 y = 2x + 3 画图像',
    '求函数斜率与截距',
    '反比例函数 k = xy 分析',
    '函数定义域与值域',
    '两直线交点坐标求解',
    '增减性与单调性判断'
  ],
  ch4: [
    '抛硬币 10 次求正面概率',
    '班级平均分方差计算',
    '中位数与众数分析',
    '扇形统计图占比',
    '抽样调查样本估计总体',
    '频率分布直方图'
  ]
};

function createChapters(): Chapter[] {
  return [
    { id: 'ch1', name: '第一章：代数基础', description: '一元一次方程、代数式化简', order: 1 },
    { id: 'ch2', name: '第二章：几何入门', description: '三角形、四边形面积计算', order: 2 },
    { id: 'ch3', name: '第三章：函数初步', description: '一次函数、反比例函数', order: 3 },
    { id: 'ch4', name: '第四章：概率统计', description: '平均数、概率计算', order: 4 }
  ];
}

function randomGrade(): GradeFeedback {
  const grades: GradeFeedback[] = ['excellent', 'good', 'pass', 'fail'];
  return grades[Math.floor(Math.random() * grades.length)];
}

function randomRules(): ReminderRule[] {
  const allRules: ReminderRule[] = ['deadline', 'retry', 'plagiarism', 'late'];
  const count = Math.floor(Math.random() * 3);
  const shuffled = allRules.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, Math.min(n, copy.length));
}

function rangeInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateHomeworkBatch(chapterId: string, count: number, now: number): Homework[] {
  const homeworks: Homework[] = [];
  const availableNames = [...STUDENT_NAMES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count; i++) {
    const isLate = Math.random() > 0.6;
    const hasPlagiarism = Math.random() > 0.8;
    const needsRetry = Math.random() > 0.7;
    const correctGrade = randomGrade();
    const baseRules = randomRules();

    if (isLate && !baseRules.includes('late')) baseRules.push('late');
    if (hasPlagiarism && !baseRules.includes('plagiarism')) baseRules.push('plagiarism');
    if (needsRetry && !baseRules.includes('retry') && correctGrade !== 'excellent') baseRules.push('retry');

    const lateHours = isLate ? rangeInt(1, 72) : 0;
    let deadlineHoursLeft: number;
    if (isLate) {
      deadlineHoursLeft = -lateHours;
    } else if (baseRules.includes('deadline')) {
      deadlineHoursLeft = rangeInt(1, 12);
    } else {
      deadlineHoursLeft = rangeInt(24, 120);
    }
    const submitTime = now - rangeInt(1, 72) * 3600 * 1000;
    const deadline = isLate
      ? submitTime + (rangeInt(1, 24)) * 3600 * 1000
      : now + deadlineHoursLeft * 3600 * 1000;

    const attemptCount = needsRetry ? rangeInt(2, 4) : 1;
    const similarityScore = hasPlagiarism ? rangeInt(70, 98) : rangeInt(5, 35);

    const scoreRange = GRADE_SCORE_RANGES[correctGrade];
    const score = rangeInt(scoreRange[0], scoreRange[1]);
    const scoreHint = `预估得分：约 ${score} 分`;

    const qualityHints = pickRandom(GRADE_QUALITY_POOLS[correctGrade], 3);

    const ruleClues: { type: ReminderRule; text: string }[] = [];
    if (isLate) {
      ruleClues.push({ type: 'late', text: `⏰ 提交时间超期 ${lateHours} 小时` });
    }
    if (hasPlagiarism) {
      ruleClues.push({ type: 'plagiarism', text: `🔍 与往届作业相似度 ${similarityScore}%` });
    }
    if (needsRetry) {
      ruleClues.push({ type: 'retry', text: `🔁 第 ${attemptCount} 次提交（已被退回重写 ${attemptCount - 1} 次）` });
    }
    if (baseRules.includes('deadline')) {
      ruleClues.push({ type: 'deadline', text: `📅 距本次作业统一截止仅 ${deadlineHoursLeft} 小时` });
    }

    const chapterClues = pickRandom(CHAPTER_CLUE_POOLS[chapterId] || [], 3);

    homeworks.push({
      id: `hw_${chapterId}_${now}_${i}`,
      chapterId,
      studentName: availableNames[i % availableNames.length],
      submitTime,
      deadline,
      isLate,
      hasPlagiarism,
      needsRetry,
      correctGrade,
      correctRules: baseRules,
      scoreHint,
      qualityHints,
      ruleClues,
      chapterClues,
      attemptCount,
      similarityScore,
      lateHours,
      deadlineHoursLeft
    });
  }
  return homeworks;
}

export function checkChoice(
  homework: Homework,
  selectedGrade: GradeFeedback | null,
  selectedRules: ReminderRule[],
  selectedChapterId: string | null
): ChoiceResult {
  const gradeCorrect = selectedGrade === homework.correctGrade;
  const rulesCorrect =
    selectedRules.length === homework.correctRules.length &&
    selectedRules.every(r => homework.correctRules.includes(r));
  const chapterCorrect = selectedChapterId === homework.chapterId;

  const isCorrect = gradeCorrect && rulesCorrect && chapterCorrect;

  let errorType: 'grade' | 'rule' | 'chapter' | undefined;
  if (!gradeCorrect) errorType = 'grade';
  else if (!rulesCorrect) errorType = 'rule';
  else if (!chapterCorrect) errorType = 'chapter';

  return {
    homeworkId: homework.id,
    selectedGrade,
    selectedRules,
    selectedChapterId,
    isCorrect,
    timeTaken: 0,
    errorType
  };
}

export function createInitialStats(): GameStats {
  return {
    totalAttempts: 0,
    correctCount: 0,
    completionRate: 0,
    averageTimePerHomework: 0,
    chapterStats: new Map(),
    recentFailures: [],
    errorBreakdown: { gradeErrors: 0, ruleErrors: 0, chapterErrors: 0 }
  };
}

export function updateStats(stats: GameStats, results: ChoiceResult[], chapterId: string): GameStats {
  const newStats = { ...stats };
  newStats.totalAttempts += results.length;
  newStats.correctCount += results.filter(r => r.isCorrect).length;
  newStats.completionRate = newStats.totalAttempts > 0
    ? newStats.correctCount / newStats.totalAttempts
    : 0;

  const totalTime = results.reduce((acc, r) => acc + r.timeTaken, 0);
  const prevTotal = newStats.averageTimePerHomework * (newStats.totalAttempts - results.length);
  newStats.averageTimePerHomework = (prevTotal + totalTime) / newStats.totalAttempts;

  const chStat = newStats.chapterStats.get(chapterId) || { attempts: 0, correct: 0, failures: 0 };
  chStat.attempts += results.length;
  chStat.correct += results.filter(r => r.isCorrect).length;
  const hasErrors = results.some(r => !r.isCorrect);
  if (hasErrors) chStat.failures += 1;
  newStats.chapterStats.set(chapterId, chStat);

  results.forEach(r => {
    if (r.errorType === 'grade') newStats.errorBreakdown.gradeErrors++;
    else if (r.errorType === 'rule') newStats.errorBreakdown.ruleErrors++;
    else if (r.errorType === 'chapter') newStats.errorBreakdown.chapterErrors++;
  });

  return newStats;
}

export function addFailureRecord(
  stats: GameStats,
  chapterId: string,
  errors: ChoiceResult[],
  snapshot: ReplaySnapshot
): GameStats {
  const record: FailureRecord = {
    id: `fail_${Date.now()}`,
    timestamp: Date.now(),
    chapterId,
    errors,
    replaySnapshot: snapshot
  };

  const newFailures = [record, ...stats.recentFailures].slice(0, 3);
  return { ...stats, recentFailures: newFailures };
}

export { GRADE_LABELS, RULE_LABELS, createChapters };
