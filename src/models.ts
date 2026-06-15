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

    homeworks.push({
      id: `hw_${chapterId}_${now}_${i}`,
      chapterId,
      studentName: availableNames[i % availableNames.length],
      submitTime: now - Math.floor(Math.random() * 86400000),
      deadline: now + Math.floor(Math.random() * 172800000),
      isLate,
      hasPlagiarism,
      needsRetry,
      correctGrade,
      correctRules: baseRules
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
