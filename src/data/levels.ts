import { LevelData, Student, Assignment, Chapter, ReminderRule, Submission } from '../types';
import {
  STUDENT_NAMES,
  STUDENT_AVATARS,
  ASSIGNMENT_TITLES,
  ASSIGNMENT_DESCRIPTIONS,
  DIFFICULTY_LEVELS,
  CHAPTER_TITLES,
  CHAPTER_TOPICS,
  REMINDER_RULE_TEMPLATES,
  SUBMISSION_CONTENTS,
  COURSE_NAMES,
  SEMESTERS
} from './questionBank';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudents(count: number, basePerformance: number, variance: number): Student[] {
  const students: Student[] = [];
  const shuffledNames = [...STUDENT_NAMES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count && i < shuffledNames.length; i++) {
    const performance = Math.max(0, Math.min(100, basePerformance + randomInt(-variance, variance)));
    const improvement = randomInt(-10, 20);
    students.push({
      id: generateId('student'),
      name: shuffledNames[i],
      avatar: STUDENT_AVATARS[i % STUDENT_AVATARS.length],
      performance,
      improvement,
      submissions: []
    });
  }

  return students;
}

function generateAssignments(chapterNum: number, count: number, startIndex: number = 0): Assignment[] {
  const assignments: Assignment[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const titleIndex = (startIndex + i) % ASSIGNMENT_TITLES.length;
    const difficulty = randomChoice(DIFFICULTY_LEVELS);
    const maxScore = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 80 : 100;
    const weight = difficulty === 'easy' ? 0.1 : difficulty === 'medium' ? 0.2 : 0.3;

    assignments.push({
      id: generateId('assignment'),
      title: ASSIGNMENT_TITLES[titleIndex],
      description: ASSIGNMENT_DESCRIPTIONS[titleIndex % ASSIGNMENT_DESCRIPTIONS.length],
      chapter: chapterNum,
      difficulty,
      deadline: now + randomInt(1, 14) * 24 * 60 * 60 * 1000,
      maxScore,
      weight
    });
  }

  return assignments;
}

function generateChapters(count: number, assignmentsPerChapter: number): Chapter[] {
  const chapters: Chapter[] = [];
  let assignmentIndex = 0;

  for (let i = 0; i < count && i < CHAPTER_TITLES.length; i++) {
    chapters.push({
      id: generateId('chapter'),
      number: i + 1,
      title: CHAPTER_TITLES[i],
      topics: CHAPTER_TOPICS[i] || [],
      assignments: generateAssignments(i + 1, assignmentsPerChapter, assignmentIndex)
    });
    assignmentIndex += assignmentsPerChapter;
  }

  return chapters;
}

function generateReminderRules(count: number): ReminderRule[] {
  const rules: ReminderRule[] = [];
  const shuffledTemplates = [...REMINDER_RULE_TEMPLATES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count && i < shuffledTemplates.length; i++) {
    const template = shuffledTemplates[i];
    rules.push({
      id: generateId('rule'),
      title: template.title,
      description: template.description,
      condition: template.condition,
      action: template.action,
      penalty: template.penalty,
      active: i < 3
    });
  }

  return rules;
}

function generateSubmissions(students: Student[], assignments: Assignment[]): void {
  const now = Date.now();

  students.forEach(student => {
    assignments.forEach(assignment => {
      const submissionChance = 0.7 + (student.performance / 100) * 0.25;
      if (Math.random() < submissionChance) {
        const baseScore = Math.max(0, Math.min(assignment.maxScore,
          student.performance * (assignment.maxScore / 100) + randomInt(-15, 15)));
        const isLate = Math.random() < 0.25;
        const submittedAt = isLate
          ? assignment.deadline + randomInt(1, 72) * 60 * 60 * 1000
          : now - randomInt(1, 72) * 60 * 60 * 1000;

        const submission: Submission = {
          id: generateId('submission'),
          assignmentId: assignment.id,
          studentId: student.id,
          score: Math.round(baseScore),
          submittedAt,
          isLate,
          content: randomChoice(SUBMISSION_CONTENTS)
        };

        student.submissions.push(submission);
      }
    });
  });
}

export interface LevelConfig {
  id: string;
  title: string;
  description: string;
  courseIndex: number;
  semesterIndex: number;
  studentCount: number;
  chapterCount: number;
  assignmentsPerChapter: number;
  ruleCount: number;
  timeLimit: number;
  targetCompletionRate: number;
  basePerformance: number;
  performanceVariance: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'level_1',
    title: '第一关：初识评教',
    description: '熟悉评教流程，从观察学生成绩开始',
    courseIndex: 0,
    semesterIndex: 0,
    studentCount: 6,
    chapterCount: 3,
    assignmentsPerChapter: 2,
    ruleCount: 3,
    timeLimit: 300,
    targetCompletionRate: 0.7,
    basePerformance: 70,
    performanceVariance: 15
  },
  {
    id: 'level_2',
    title: '第二关：严格要求',
    description: '学生人数增加，需要更高效的评分策略',
    courseIndex: 1,
    semesterIndex: 0,
    studentCount: 10,
    chapterCount: 4,
    assignmentsPerChapter: 2,
    ruleCount: 4,
    timeLimit: 420,
    targetCompletionRate: 0.75,
    basePerformance: 65,
    performanceVariance: 20
  },
  {
    id: 'level_3',
    title: '第三关：挑战极限',
    description: '高难度课程，需要精确把控每一个评分细节',
    courseIndex: 5,
    semesterIndex: 1,
    studentCount: 12,
    chapterCount: 5,
    assignmentsPerChapter: 3,
    ruleCount: 6,
    timeLimit: 600,
    targetCompletionRate: 0.8,
    basePerformance: 60,
    performanceVariance: 25
  }
];

export function generateLevel(config: LevelConfig): LevelData {
  const students = generateStudents(config.studentCount, config.basePerformance, config.performanceVariance);
  const chapters = generateChapters(config.chapterCount, config.assignmentsPerChapter);
  const allAssignments = chapters.flatMap(c => c.assignments);
  const reminderRules = generateReminderRules(config.ruleCount);

  generateSubmissions(students, allAssignments);

  return {
    id: config.id,
    title: config.title,
    description: config.description,
    courseName: COURSE_NAMES[config.courseIndex % COURSE_NAMES.length],
    semester: SEMESTERS[config.semesterIndex % SEMESTERS.length],
    chapters,
    students,
    reminderRules,
    timeLimit: config.timeLimit,
    targetCompletionRate: config.targetCompletionRate
  };
}

export function getAllLevels(): LevelData[] {
  return LEVEL_CONFIGS.map(config => generateLevel(config));
}

export function getLevelById(levelId: string): LevelData | null {
  const config = LEVEL_CONFIGS.find(c => c.id === levelId);
  return config ? generateLevel(config) : null;
}

export function addCustomLevel(config: Omit<LevelConfig, 'id'> & { id?: string }): LevelConfig {
  const newConfig: LevelConfig = {
    ...config,
    id: config.id || `level_custom_${Date.now()}`
  };
  LEVEL_CONFIGS.push(newConfig);
  return newConfig;
}
