import { GameScene } from './scene';
import { UIManager } from './ui';
import {
  createChapters,
  generateHomeworkBatch,
  checkChoice,
  createInitialStats,
  updateStats,
  addFailureRecord
} from './models';
import type {
  Homework,
  Chapter,
  GradeFeedback,
  ReminderRule,
  ChoiceResult,
  GameStats,
  ReplaySnapshot
} from './types';

const TIME_PER_HOMEWORK = 20;
const HOMEWORKS_PER_ROUND = 6;
const WARNING_THRESHOLD = 0.3;

class GameApp {
  private scene: GameScene;
  private ui: UIManager;
  private chapters: Chapter[];
  private currentHomeworks: Homework[] = [];
  private currentResults: ChoiceResult[] = [];
  private currentChapterId = 'ch1';
  private roundStartTime = 0;
  private homeworkStartTime = 0;
  private stats: GameStats;
  private lastFrameTime = 0;
  private animFrameId: number = 0;
  private gradedCount = 0;

  private activeGradingHomeworkId: string | null = null;
  private timerActive = false;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const uiRoot = document.getElementById('uiRoot') as HTMLElement;

    this.scene = new GameScene(canvas);
    this.ui = new UIManager(uiRoot);
    this.chapters = createChapters();
    this.stats = createInitialStats();
    this.ui.setStats(this.stats);

    this.bindEvents();
    this.startGameLoop();
  }

  private bindEvents(): void {
    this.scene.setOnCardClick((hw) => this.openGradingPanel(hw));

    this.ui.setOnSubmit((grade, rules, chapterId) => this.handleSubmit(grade, rules, chapterId));

    this.ui.setOnTimeout(() => this.handleTimeout());

    this.ui.setOnStartChapter((chId) => this.startChapter(chId));

    this.ui.setOnReview(() => {
      this.ui.startReview(this.currentHomeworks, this.currentResults);
    });

    this.ui.setOnBack(() => {
      this.ui.setStats(this.stats);
    });

    this.ui.setOnCancelGrading(() => {
      this.closeGradingPanel();
    });
  }

  private startChapter(chapterId: string): void {
    this.currentChapterId = chapterId;
    this.currentHomeworks = generateHomeworkBatch(chapterId, HOMEWORKS_PER_ROUND, Date.now());
    this.currentResults = [];
    this.gradedCount = 0;
    this.roundStartTime = performance.now();
    this.activeGradingHomeworkId = null;
    this.timerActive = false;

    this.scene.spawnHomeworkCards(this.currentHomeworks, this.chapters);
    this.scene.showProgressWarning(false);
    this.ui.showIdleHUD(true, this.currentHomeworks.length, 0);

    this.ui.setStats(this.stats);
  }

  private openGradingPanel(hw: Homework): void {
    if (this.currentResults.find(r => r.homeworkId === hw.id)) return;
    if (this.timerActive) return;

    this.activeGradingHomeworkId = hw.id;
    this.homeworkStartTime = performance.now();
    this.timerActive = true;
    this.ui.startRound(hw, this.currentChapterId, TIME_PER_HOMEWORK, this.currentHomeworks.length, this.gradedCount);
    this.scene.showProgressWarning(false);
  }

  private closeGradingPanel(): void {
    this.timerActive = false;
    this.activeGradingHomeworkId = null;
    this.ui.showIdleHUD(true, this.currentHomeworks.length, this.gradedCount);
  }

  private handleSubmit(
    selectedGrade: GradeFeedback | null,
    selectedRules: ReminderRule[],
    selectedChapterId: string | null
  ): void {
    if (!this.activeGradingHomeworkId) return;
    const activeHw = this.currentHomeworks.find(h => h.id === this.activeGradingHomeworkId);
    if (!activeHw) return;

    const timeTaken = (performance.now() - this.homeworkStartTime) / 1000;
    const result = checkChoice(activeHw, selectedGrade, selectedRules, selectedChapterId);
    result.timeTaken = timeTaken;

    this.currentResults.push(result);
    this.gradedCount++;
    this.timerActive = false;
    this.activeGradingHomeworkId = null;

    this.scene.highlightCard(activeHw.id, result.isCorrect);
    this.ui.submitResult(result, this.gradedCount);

    if (this.gradedCount >= this.currentHomeworks.length) {
      this.finishRound();
    } else {
      this.ui.showIdleHUD(true, this.currentHomeworks.length, this.gradedCount);
    }
  }

  private handleTimeout(): void {
    if (!this.activeGradingHomeworkId) return;
    const activeHw = this.currentHomeworks.find(h => h.id === this.activeGradingHomeworkId);
    if (!activeHw) return;

    const result: ChoiceResult = {
      homeworkId: activeHw.id,
      selectedGrade: null,
      selectedRules: [],
      selectedChapterId: null,
      isCorrect: false,
      timeTaken: TIME_PER_HOMEWORK,
      errorType: 'grade'
    };
    this.currentResults.push(result);
    this.gradedCount++;
    this.timerActive = false;
    this.activeGradingHomeworkId = null;

    this.scene.highlightCard(activeHw.id, false);
    this.ui.submitResult(result, this.gradedCount);

    if (this.gradedCount >= this.currentHomeworks.length) {
      this.finishRound();
    } else {
      this.ui.showIdleHUD(true, this.currentHomeworks.length, this.gradedCount);
    }
  }

  private finishRound(): void {
    this.scene.showProgressWarning(false);
    this.timerActive = false;
    this.activeGradingHomeworkId = null;
    this.stats = updateStats(this.stats, this.currentResults, this.currentChapterId);

    const errors = this.currentResults.filter(r => !r.isCorrect);
    if (errors.length > 0) {
      const correctAnswers = new Map<string, { grade: GradeFeedback; rules: ReminderRule[]; chapterId: string }>();
      this.currentHomeworks.forEach(hw => {
        correctAnswers.set(hw.id, {
          grade: hw.correctGrade,
          rules: hw.correctRules,
          chapterId: hw.chapterId
        });
      });
      const snapshot: ReplaySnapshot = {
        homeworks: [...this.currentHomeworks],
        playerChoices: [...this.currentResults],
        correctAnswers
      };
      this.stats = addFailureRecord(this.stats, this.currentChapterId, errors, snapshot);
    }

    this.ui.setStats(this.stats);
  }

  private startGameLoop(): void {
    this.lastFrameTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;

      if (this.timerActive) {
        this.ui.tick(dt);
      }

      const total = this.currentHomeworks.length;
      if (total > 0 && !this.timerActive) {
        const progress = this.gradedCount / total;
        const elapsed = (now - this.roundStartTime) / 1000;
        const totalEstimated = total * TIME_PER_HOMEWORK;
        const timePressure = elapsed / totalEstimated;
        const remaining = total - this.gradedCount;
        if (timePressure > progress + WARNING_THRESHOLD && remaining > 0) {
          this.scene.showProgressWarning(true);
        } else {
          this.scene.showProgressWarning(false);
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.scene.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
