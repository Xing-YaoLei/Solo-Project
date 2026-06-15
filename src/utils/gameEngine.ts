import type { LevelConfig, TextbookItem, Slot, Subject, GameStats } from '@/types/game';
import { getSubjectInfo, getGradeLabel } from '@/data/levels';

const randInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface GeneratedLevel {
  textbooks: TextbookItem[];
  slots: Slot[];
}

export const generateLevel = (config: LevelConfig): GeneratedLevel => {
  const { subjects, gradeRange, textbookCount, slotCount } = config;

  const slots: Slot[] = [];
  const usedKeys = new Set<string>();
  const slotSubjectGrades: { subject: Subject; grade: number }[] = [];

  while (slots.length < slotCount) {
    const subject = randomChoice(subjects);
    const grade = randInt(gradeRange[0], gradeRange[1]);
    const key = `${subject}-${grade}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    slotSubjectGrades.push({ subject, grade });
    slots.push({
      id: slots.length,
      subject,
      grade,
      capacity: randInt(20, 50),
      current: 0,
    });
  }

  const textbooks: TextbookItem[] = [];

  for (let i = 0; i < textbookCount; i++) {
    let subject: Subject;
    let grade: number;
    let targetSlotId: number;

    if (Math.random() < 0.75) {
      const slot = randomChoice(slots);
      subject = slot.subject;
      grade = slot.grade;
      targetSlotId = slot.id;
    } else {
      subject = randomChoice(subjects);
      grade = randInt(gradeRange[0], gradeRange[1]);
      const matchingSlot = slots.find(s => s.subject === subject && s.grade === grade);
      targetSlotId = matchingSlot ? matchingSlot.id : -1;
    }

    const info = getSubjectInfo(subject);
    textbooks.push({
      id: uuid(),
      subject,
      grade,
      label: `${info.icon} ${info.name}${getGradeLabel(grade)}`,
      quantity: randInt(1, 10),
      targetSlot: targetSlotId,
    });
  }

  return {
    textbooks: shuffle(textbooks),
    slots,
  };
};

export const checkMatch = (textbook: TextbookItem, slot: Slot): { correct: boolean; reason?: string } => {
  if (textbook.subject !== slot.subject) {
    return { correct: false, reason: '科目不匹配' };
  }
  if (textbook.grade !== slot.grade) {
    return { correct: false, reason: '年级不匹配' };
  }
  if (slot.current + textbook.quantity > slot.capacity) {
    return { correct: false, reason: '容量不足' };
  }
  return { correct: true };
};

export const calculateScore = (
  stats: GameStats,
  level: LevelConfig,
  totalTextbooks: number,
  processedTextbooks: number,
): GameStats => {
  const accuracy = stats.totalAttempts > 0 ? stats.correctCount / stats.totalAttempts : 0;
  const completionRate = totalTextbooks > 0 ? processedTextbooks / totalTextbooks : 0;

  const baseScore = stats.correctCount * 100;
  const comboScore = stats.maxCombo * 20;
  const wrongPenalty = stats.wrongCount * 30;

  const timeUsed = stats.totalTime - stats.timeRemaining;
  const timeRatio = timeUsed > 0 ? Math.max(0, stats.timeRemaining / stats.totalTime) : 1;
  const timeBonus = Math.floor(baseScore * timeRatio * level.timeBonusMultiplier * 0.5);

  const accuracyBonus = Math.floor(baseScore * accuracy * level.accuracyBonusMultiplier * 0.5);
  const comboBonus = Math.floor(comboScore * level.comboBonusMultiplier);

  const totalScore = Math.max(0, baseScore + comboScore - wrongPenalty + timeBonus + accuracyBonus + comboBonus);

  const passed =
    accuracy >= level.minAccuracy &&
    stats.maxCombo >= level.minCombo &&
    (level.mode === 'free' || completionRate >= 0.6);

  const completed = stats.timeRemaining <= 0 || processedTextbooks >= totalTextbooks;

  return {
    ...stats,
    score: totalScore,
    timeBonus,
    accuracyBonus,
    comboBonus,
    completionRate,
    completed,
    passed,
  };
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getAnimationDuration = (intensity: 'off' | 'low' | 'medium' | 'high', baseMs: number): number => {
  switch (intensity) {
    case 'off': return 0;
    case 'low': return baseMs * 0.5;
    case 'medium': return baseMs;
    case 'high': return baseMs * 1.5;
    default: return baseMs;
  }
};

export const getGradeColor = (grade: number): string => {
  if (grade <= 3) return '#10B981';
  if (grade <= 6) return '#3B82F6';
  if (grade <= 9) return '#8B5CF6';
  return '#EF4444';
};
