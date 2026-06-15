import { GameState, SaveData, GamePhase, GameStage, LevelData, ProgressRecord } from '../types';
import { getLevelById } from '../data/levels';

const SAVE_KEY = 'teaching_evaluation_simulator_save';

class GameStateManager {
  private state: GameState;
  private saveData: SaveData;
  private listeners: Set<(state: GameState) => void>;

  constructor() {
    this.listeners = new Set();
    this.saveData = this.loadSaveData();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      currentPhase: 'loading',
      currentStage: 'feedback',
      currentLevelId: '',
      currentChapterIndex: 0,
      timeRemaining: 0,
      totalScore: 0,
      completionRate: 0,
      assignmentsGraded: [],
      remindersSent: [],
      students: [],
      assignments: [],
      isPaused: false,
      progressHistory: [],
      lagWarningShown: false,
      selectedStudentId: null,
      selectedAssignmentId: null,
      currentScoreInput: null
    };
  }

  private loadSaveData(): SaveData {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return {
      unlockedLevels: ['level_1'],
      levelScores: {},
      levelCompletionRates: {},
      totalPlayTime: 0,
      lastPlayed: Date.now()
    };
  }

  private saveSaveData(): void {
    try {
      this.saveData.lastPlayed = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.saveData));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  getSaveData(): SaveData {
    return { ...this.saveData };
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  setPhase(phase: GamePhase): void {
    this.state.currentPhase = phase;
    this.notify();
  }

  setStage(stage: GameStage): void {
    this.state.currentStage = stage;
    this.recordProgress();
    this.notify();
  }

  startLevel(levelId: string): boolean {
    const levelData = getLevelById(levelId);
    if (!levelData) return false;

    const allAssignments = levelData.chapters.flatMap(c => c.assignments);

    this.state = {
      ...this.createInitialState(),
      currentPhase: 'playing',
      currentLevelId: levelId,
      timeRemaining: levelData.timeLimit,
      students: levelData.students,
      assignments: allAssignments
    };

    this.recordProgress();
    this.notify();
    return true;
  }

  updateTime(deltaSeconds: number): void {
    if (this.state.currentPhase !== 'playing' || this.state.isPaused) return;

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - deltaSeconds);
    this.saveData.totalPlayTime += deltaSeconds;

    if (this.state.timeRemaining <= 0) {
      this.endLevel();
    }

    this.notify();
  }

  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
    this.notify();
  }

  selectStudent(studentId: string | null): void {
    this.state.selectedStudentId = studentId;
    this.notify();
  }

  selectAssignment(assignmentId: string | null): void {
    this.state.selectedAssignmentId = assignmentId;
    this.notify();
  }

  setScoreInput(score: number | null): void {
    this.state.currentScoreInput = score;
    this.notify();
  }

  gradeAssignment(submissionId: string, score: number): void {
    if (this.state.assignmentsGraded.includes(submissionId)) return;

    this.state.assignmentsGraded.push(submissionId);
    this.state.totalScore += score;
    this.state.currentScoreInput = null;

    for (const student of this.state.students) {
      const submission = student.submissions.find(s => s.id === submissionId);
      if (submission) {
        submission.score = score;
        break;
      }
    }

    this.updateCompletionRate();
    this.recordProgress();
    this.notify();
  }

  sendReminder(ruleId: string): void {
    if (this.state.remindersSent.includes(ruleId)) return;
    this.state.remindersSent.push(ruleId);
    this.notify();
  }

  toggleRule(ruleId: string, active: boolean, levelData: LevelData): void {
    const rule = levelData.reminderRules.find(r => r.id === ruleId);
    if (rule) {
      rule.active = active;
    }
    this.notify();
  }

  nextChapter(): void {
    this.state.currentChapterIndex++;
    this.recordProgress();
    this.notify();
  }

  private updateCompletionRate(): void {
    const totalSubmissions = this.state.students.reduce(
      (sum, student) => sum + student.submissions.length, 0
    );
    this.state.completionRate = totalSubmissions > 0
      ? this.state.assignmentsGraded.length / totalSubmissions
      : 0;
  }

  private recordProgress(): void {
    const record: ProgressRecord = {
      timestamp: Date.now(),
      stage: this.state.currentStage,
      completionRate: this.state.completionRate,
      score: this.state.totalScore,
      assignmentsGraded: this.state.assignmentsGraded.length
    };
    this.state.progressHistory.push(record);
  }

  checkProgressLag(expectedRate: number): boolean {
    if (this.state.lagWarningShown) return false;

    const lag = expectedRate - this.state.completionRate;
    if (lag > 0.2) {
      this.state.lagWarningShown = true;
      return true;
    }
    return false;
  }

  confirmNextAction(): void {
    this.state.lagWarningShown = false;
    this.notify();
  }

  endLevel(): void {
    const levelId = this.state.currentLevelId;
    const finalScore = this.state.totalScore;
    const finalCompletionRate = this.state.completionRate;

    const existingScore = this.saveData.levelScores[levelId] || 0;
    if (finalScore > existingScore) {
      this.saveData.levelScores[levelId] = finalScore;
    }

    const existingRate = this.saveData.levelCompletionRates[levelId] || 0;
    if (finalCompletionRate > existingRate) {
      this.saveData.levelCompletionRates[levelId] = finalCompletionRate;
    }

    if (finalCompletionRate >= 0.6) {
      const currentIndex = this.saveData.unlockedLevels.indexOf(levelId);
      if (currentIndex >= 0 && currentIndex + 1 < 3) {
        const nextLevelId = `level_${currentIndex + 2}`;
        if (!this.saveData.unlockedLevels.includes(nextLevelId)) {
          this.saveData.unlockedLevels.push(nextLevelId);
        }
      }
    }

    this.saveSaveData();
    this.setPhase('review');
  }

  goToMenu(): void {
    this.state = this.createInitialState();
    this.setPhase('menu');
  }

  restartLevel(): void {
    const levelId = this.state.currentLevelId;
    if (levelId) {
      this.startLevel(levelId);
    }
  }

  resetProgress(): void {
    this.saveData = {
      unlockedLevels: ['level_1'],
      levelScores: {},
      levelCompletionRates: {},
      totalPlayTime: 0,
      lastPlayed: Date.now()
    };
    this.saveSaveData();
    this.notify();
  }
}

export const gameStateManager = new GameStateManager();
