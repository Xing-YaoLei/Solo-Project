import type { Question, RuleQuestion, EvidenceQuestion, SettlementQuestion, CompensationQuestion, UserAnswer } from '@/types/game';
import type { QuestionResult } from '@/types/record';

const STORAGE_DEFAULT_REWARDS = {
  pointsPerCorrectAnswer: 10,
  bonusForPerfectScore: 50,
  bonusForFastCompletion: 30,
  starsThresholds: [60, 80, 95] as [number, number, number],
  badges: [],
};

export const calculateRuleScore = (
  question: RuleQuestion,
  selectedRuleIds: string[]
): { isCorrect: boolean; score: number; errorAnalysis?: string } => {
  const correctSet = new Set(question.correctRuleIds);
  const selectedSet = new Set(selectedRuleIds);

  let correctCount = 0;
  let wrongCount = 0;
  const missedRules: string[] = [];
  const wrongSelections: string[] = [];

  question.correctRuleIds.forEach(id => {
    if (selectedSet.has(id)) {
      correctCount++;
    } else {
      missedRules.push(question.availableRules.find(r => r.id === id)?.name || id);
    }
  });

  selectedRuleIds.forEach(id => {
    if (!correctSet.has(id)) {
      wrongCount++;
      wrongSelections.push(question.availableRules.find(r => r.id === id)?.name || id);
    }
  });

  const totalRules = question.correctRuleIds.length;
  const accuracy = totalRules === 0 ? 1 : Math.max(0, (correctCount - wrongCount * 0.5)) / totalRules;
  const score = Math.round(question.score * accuracy);
  const isCorrect = accuracy >= 0.8;

  let errorAnalysis: string | undefined;
  if (!isCorrect) {
    const parts: string[] = [];
    if (missedRules.length > 0) parts.push(`遗漏规则: ${missedRules.join('、')}`);
    if (wrongSelections.length > 0) parts.push(`错误选择: ${wrongSelections.join('、')}`);
    errorAnalysis = parts.join('；');
  }

  return { isCorrect, score, errorAnalysis };
};

export const calculateEvidenceScore = (
  question: EvidenceQuestion,
  selectedEvidenceIds: string[]
): { isCorrect: boolean; score: number; errorAnalysis?: string } => {
  const correctSet = new Set(question.correctEvidenceIds);
  const selectedSet = new Set(selectedEvidenceIds);

  let correctCount = 0;
  let wrongCount = 0;
  const missed: string[] = [];
  const wrongSelections: string[] = [];

  question.correctEvidenceIds.forEach(id => {
    if (selectedSet.has(id)) correctCount++;
    else {
      const evi = question.evidencePool.find(e => e.id === id);
      missed.push(evi?.title || id);
    }
  });

  selectedEvidenceIds.forEach(id => {
    if (!correctSet.has(id)) {
      wrongCount++;
      const evi = question.evidencePool.find(e => e.id === id);
      wrongSelections.push(evi?.title || id);
    }
  });

  const totalCorrect = question.correctEvidenceIds.length;
  const accuracy = totalCorrect === 0 ? 1 : Math.max(0, (correctCount - wrongCount * 0.5)) / totalCorrect;
  const score = Math.round(question.score * accuracy);
  const isCorrect = accuracy >= 0.75 && selectedEvidenceIds.length >= question.minRequired;

  let errorAnalysis: string | undefined;
  if (!isCorrect) {
    const parts: string[] = [];
    if (missed.length > 0) parts.push(`缺少有效证据: ${missed.join('、')}`);
    if (wrongSelections.length > 0) parts.push(`无效证据: ${wrongSelections.join('、')}`);
    errorAnalysis = parts.join('；');
  }

  return { isCorrect, score, errorAnalysis };
};

export const calculateSettlementScore = (
  question: SettlementQuestion,
  orderedItemIds: string[]
): { isCorrect: boolean; score: number; errorAnalysis?: string } => {
  const sortedCorrect = [...question.items]
    .sort((a, b) => {
      if (question.sortBy === 'time') {
        return question.ascending
          ? a.time.localeCompare(b.time)
          : b.time.localeCompare(a.time);
      } else if (question.sortBy === 'amount') {
        return question.ascending ? a.amount - b.amount : b.amount - a.amount;
      }
      return a.correctOrder - b.correctOrder;
    })
    .map(i => i.id);

  let correctPositions = 0;
  orderedItemIds.forEach((id, idx) => {
    if (id === sortedCorrect[idx]) correctPositions++;
  });

  const accuracy = correctPositions / question.items.length;
  const score = Math.round(question.score * accuracy);
  const isCorrect = accuracy >= 0.85;

  let errorAnalysis: string | undefined;
  if (!isCorrect) {
    errorAnalysis = `正确排序位置仅 ${correctPositions}/${question.items.length}，请严格按照${
      question.sortBy === 'time' ? '发生时间' : question.sortBy === 'amount' ? '金额' : '业务逻辑'
    }${question.ascending ? '从早到晚/从小到大' : '从晚到早/从大到小'}排列`;
  }

  return { isCorrect, score, errorAnalysis };
};

export const calculateCompensationScore = (
  question: CompensationQuestion,
  causeId: string,
  amountValue: string
): { isCorrect: boolean; score: number; errorAnalysis?: string } => {
  const causeCorrect = causeId === question.caseData.correctCauseId;
  const amountCorrect = Number(amountValue) === question.caseData.correctAmount;

  const causeWeight = 0.6;
  const amountWeight = 0.4;
  const accuracy = (causeCorrect ? causeWeight : 0) + (amountCorrect ? amountWeight : 0);
  const score = Math.round(question.score * accuracy);
  const isCorrect = accuracy >= 0.8;

  let errorAnalysis: string | undefined;
  if (!isCorrect) {
    const parts: string[] = [];
    if (!causeCorrect) {
      const correctCause = question.caseData.possibleCauses.find(c => c.id === question.caseData.correctCauseId);
      parts.push(`损坏原因判定错误，正确应为「${correctCause?.name}」：${correctCause?.description}`);
    }
    if (!amountCorrect) {
      parts.push(`赔付金额不正确，应为 ¥${question.caseData.correctAmount}`);
    }
    errorAnalysis = parts.join('；');
  }

  return { isCorrect, score, errorAnalysis };
};

export const evaluateAnswer = (
  question: Question,
  answer: UserAnswer['answer']
): { isCorrect: boolean; score: number; errorAnalysis?: string } => {
  switch (question.type) {
    case 'rule':
      return calculateRuleScore(question, answer as string[]);
    case 'evidence':
      return calculateEvidenceScore(question, answer as string[]);
    case 'settlement':
      return calculateSettlementScore(question, answer as string[]);
    case 'compensation': {
      let causeId: string;
      let amountValue: string;
      if (Array.isArray(answer)) {
        [causeId, amountValue] = answer as string[];
      } else if (typeof answer === 'string') {
        [causeId, amountValue] = answer.split('|');
      } else {
        causeId = '';
        amountValue = '';
      }
      return calculateCompensationScore(question, causeId || '', amountValue || '');
    }
  }
};

export const calculateStars = (accuracy: number): number => {
  const thresholds = STORAGE_DEFAULT_REWARDS.starsThresholds;
  const pct = accuracy * 100;
  if (pct >= thresholds[2]) return 3;
  if (pct >= thresholds[1]) return 2;
  if (pct >= thresholds[0]) return 1;
  return 0;
};

export const calculateRewardPoints = (
  correctCount: number,
  accuracy: number,
  totalTime: number,
  expectedTime: number
): number => {
  let points = correctCount * STORAGE_DEFAULT_REWARDS.pointsPerCorrectAnswer;
  if (accuracy === 1) points += STORAGE_DEFAULT_REWARDS.bonusForPerfectScore;
  if (totalTime < expectedTime * 0.8) points += STORAGE_DEFAULT_REWARDS.bonusForFastCompletion;
  return points;
};

export const buildQuestionResult = (
  question: Question,
  userAnswer: UserAnswer
): QuestionResult => {
  const { isCorrect, score, errorAnalysis } = evaluateAnswer(question, userAnswer.answer);

  let correctAnswer: string[] | string;
  switch (question.type) {
    case 'rule':
      correctAnswer = question.correctRuleIds;
      break;
    case 'evidence':
      correctAnswer = question.correctEvidenceIds;
      break;
    case 'settlement':
      correctAnswer = [...question.items]
        .sort((a, b) => a.correctOrder - b.correctOrder)
        .map(i => i.id);
      break;
    case 'compensation':
      correctAnswer = `${question.caseData.correctCauseId}|${question.caseData.correctAmount}`;
      break;
  }

  return {
    questionId: question.id,
    questionType: question.type,
    title: question.title,
    isCorrect,
    userAnswer: userAnswer.answer,
    correctAnswer,
    scoreEarned: score,
    maxScore: question.score,
    timeSpent: userAnswer.timeSpent,
    errorAnalysis,
  };
};

export const computeDispatchDuration = (phaseDurations: Record<string, number>): number => {
  return Object.values(phaseDurations).reduce((sum, v) => sum + v, 0);
};
