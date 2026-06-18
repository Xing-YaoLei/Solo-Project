import { StorageManager } from '../utils/StorageManager';
import { DataManager } from './DataManager';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  highlightSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string;
}

export interface TutorialConfig {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  levelId?: string;
  triggerCondition?: string;
}

export class TutorialManager {
  private static _instance: TutorialManager | null = null;
  private _tutorials: Map<string, TutorialConfig> = new Map();
  private _completedTutorials: string[] = [];
  private _currentStepIndex: number = -1;
  private _currentTutorial: TutorialConfig | null = null;
  private _isPlaying: boolean = false;
  private _inited = false;

  public static get instance(): TutorialManager {
    if (!this._instance) {
      this._instance = new TutorialManager();
    }
    return this._instance;
  }

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get currentStep(): TutorialStep | null {
    if (!this._currentTutorial || this._currentStepIndex < 0) return null;
    return this._currentTutorial.steps[this._currentStepIndex] || null;
  }

  public init(): void {
    if (this._inited) return;
    this._inited = true;
    this._completedTutorials = StorageManager.instance.load<string[]>('completed_tutorials', []);
  }

  public async loadTutorials(): Promise<void> {
    try {
      const tutorialIds = await DataManager.instance.loadTutorialIndex();
      for (const tutorialId of tutorialIds) {
        const config = await DataManager.instance.loadTutorialConfig(tutorialId);
        if (config) {
          this._tutorials.set(tutorialId, config as TutorialConfig);
        }
      }
    } catch (e) {
      console.error('Load tutorials error:', e);
    }
  }

  public getTutorial(tutorialId: string): TutorialConfig | null {
    return this._tutorials.get(tutorialId) || null;
  }

  public isTutorialCompleted(tutorialId: string): boolean {
    return this._completedTutorials.includes(tutorialId);
  }

  public startTutorial(tutorialId: string): boolean {
    const tutorial = this._tutorials.get(tutorialId);
    if (!tutorial) {
      console.error(`Tutorial ${tutorialId} not found`);
      return false;
    }

    this._currentTutorial = tutorial;
    this._currentStepIndex = 0;
    this._isPlaying = true;

    return true;
  }

  public nextStep(): boolean {
    if (!this._currentTutorial || !this._isPlaying) return false;

    if (this._currentStepIndex < this._currentTutorial.steps.length - 1) {
      this._currentStepIndex++;
      return true;
    }

    return false;
  }

  public prevStep(): boolean {
    if (!this._currentTutorial || !this._isPlaying) return false;

    if (this._currentStepIndex > 0) {
      this._currentStepIndex--;
      return true;
    }

    return false;
  }

  public goToStep(stepIndex: number): boolean {
    if (!this._currentTutorial || !this._isPlaying) return false;
    if (stepIndex < 0 || stepIndex >= this._currentTutorial.steps.length) return false;

    this._currentStepIndex = stepIndex;
    return true;
  }

  public completeTutorial(): void {
    if (!this._currentTutorial) return;

    const tutorialId = this._currentTutorial.id;
    if (!this._completedTutorials.includes(tutorialId)) {
      this._completedTutorials.push(tutorialId);
      StorageManager.instance.save('completed_tutorials', this._completedTutorials);
    }

    this.stopTutorial();
  }

  public stopTutorial(): void {
    this._currentTutorial = null;
    this._currentStepIndex = -1;
    this._isPlaying = false;
  }

  public shouldShowTutorial(levelId: string): string | null {
    for (const [id, tutorial] of this._tutorials) {
      if (tutorial.levelId === levelId && !this.isTutorialCompleted(id)) {
        return id;
      }
    }
    return null;
  }

  public getFirstUncompletedTutorial(): TutorialConfig | null {
    for (const [id, tutorial] of this._tutorials) {
      if (!this.isTutorialCompleted(id)) {
        return tutorial;
      }
    }
    return this._tutorials.size > 0 ? this._tutorials.values().next().value : null;
  }

  public resetProgress(): void {
    this._completedTutorials = [];
    StorageManager.instance.remove('completed_tutorials');
  }

  public addTutorial(config: TutorialConfig): void {
    this._tutorials.set(config.id, config);
  }

  public getTotalSteps(): number {
    return this._currentTutorial?.steps.length || 0;
  }

  public getCurrentStepNumber(): number {
    return this._currentStepIndex + 1;
  }
}
