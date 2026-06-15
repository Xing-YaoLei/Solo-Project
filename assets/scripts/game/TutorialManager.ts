import { _decorator, Component, Node, Label, Button, Vec3, tween, UIOpacity } from 'cc';
import { Singleton } from '../core/Singleton';
import { EventBus, GameEvents } from '../core/EventBus';
import { AnalyticsService } from '../services/AnalyticsService';
import { SettingsManager } from '../config/SettingsManager';
const { ccclass, property } = _decorator;

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  targetNode?: string;
  highlightArea?: { x: number; y: number; width: number; height: number };
  action?: string;
  autoAdvance?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 0,
    title: '欢迎来到排课大师！',
    description: '你将扮演教务老师，为学生们安排课程表。让我先带你熟悉一下操作吧！',
    autoAdvance: true,
  },
  {
    id: 1,
    title: '课程目录',
    description: '这是课程目录，包含所有需要安排的课程。你可以点击并拖拽课程到教室中。',
    targetNode: 'CourseCatalog',
    action: 'drag_course',
  },
  {
    id: 2,
    title: '拖拽课程',
    description: '试着拖拽一门课程到旁边的教室区域。不同课程需要不同的设备哦！',
    action: 'course_dragged',
  },
  {
    id: 3,
    title: '教室资源',
    description: '这些是可用的教室。注意查看教室的容量和设备，确保课程需求能满足。',
    targetNode: 'ClassroomArea',
  },
  {
    id: 4,
    title: '学生名单',
    description: '这里是需要排课的学生名单。每个学生有必修课和选修课偏好。',
    targetNode: 'StudentList',
  },
  {
    id: 5,
    title: '完成目标',
    description: '当所有学生都完成了必修课并达到学分要求时，游戏就完成了！注意右上角的时间限制。',
    targetNode: 'TimeDisplay',
  },
  {
    id: 6,
    title: '道具系统',
    description: '遇到困难时可以使用道具，比如延长时间或解决冲突。但道具有冷却时间，要合理使用。',
    targetNode: 'ItemBar',
  },
  {
    id: 7,
    title: '准备开始！',
    description: '现在你已经了解了基本操作，开始你的排课之旅吧！遇到冲突不要慌，想办法解决它。',
    autoAdvance: true,
  },
];

const STORAGE_KEY = 'usg_tutorial_completed';

@ccclass('TutorialManager')
export class TutorialManager extends Singleton<TutorialManager> {
  @property(Node)
  tutorialContainer: Node | null = null;

  @property(Label)
  titleLabel: Label | null = null;

  @property(Label)
  descriptionLabel: Label | null = null;

  @property(Button)
  nextButton: Button | null = null;

  @property(Button)
  skipButton: Button | null = null;

  @property(Node)
  highlightNode: Node | null = null;

  @property(Node)
  arrowNode: Node | null = null;

  private _currentStep: number = 0;
  private _completed: boolean = false;
  private _running: boolean = false;
  private _waitingForAction: boolean = false;

  get currentStep(): number {
    return this._currentStep;
  }

  get isRunning(): boolean {
    return this._running;
  }

  get isCompleted(): boolean {
    return this._completed;
  }

  shouldShowTutorial(): boolean {
    if (this._completed) return false;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== 'true';
    } catch (e) {
      return true;
    }
  }

  start(): void {
    if (this._running) return;
    
    this._running = true;
    this._currentStep = 0;
    
    EventBus.instance.on(GameEvents.COURSE_DRAG_END, this.onCourseDragEnd.bind(this));
    EventBus.instance.on(GameEvents.COURSE_PLACED, this.onCoursePlaced.bind(this));
    
    this.showStep(0);
  }

  stop(): void {
    this._running = false;
    this._waitingForAction = false;
    
    EventBus.instance.off(GameEvents.COURSE_DRAG_END, this.onCourseDragEnd.bind(this));
    EventBus.instance.off(GameEvents.COURSE_PLACED, this.onCoursePlaced.bind(this));
    
    if (this.tutorialContainer) {
      this.tutorialContainer.active = false;
    }
  }

  private showStep(stepIndex: number): void {
    if (stepIndex >= TUTORIAL_STEPS.length) {
      this.completeTutorial();
      return;
    }

    this._currentStep = stepIndex;
    const step = TUTORIAL_STEPS[stepIndex];
    this._waitingForAction = !!step.action;

    EventBus.instance.emit(GameEvents.TUTORIAL_STEP, stepIndex, false);
    AnalyticsService.getInstance().trackTutorialStep(stepIndex, false);

    if (this.tutorialContainer) {
      const intensity = SettingsManager.getInstance().animationIntensity;
      
      if (intensity > 0) {
        const opacity = this.tutorialContainer.getComponent(UIOpacity);
        if (opacity) {
          opacity.opacity = 0;
        }
        this.tutorialContainer.active = true;
        
        tween(opacity)
          .to(0.2 * intensity, { opacity: 255 })
          .start();
      } else {
        this.tutorialContainer.active = true;
      }
    }

    if (this.titleLabel) {
      this.titleLabel.string = step.title;
    }

    if (this.descriptionLabel) {
      this.descriptionLabel.string = step.description;
    }

    if (this.nextButton) {
      this.nextButton.node.active = !step.action;
    }

    this.updateHighlight(step);
    this.updateArrow(step);

    if (step.autoAdvance) {
      this.scheduleNextStep(3);
    }
  }

  private updateHighlight(step: TutorialStep): void {
    if (!this.highlightNode) return;

    if (step.highlightArea) {
      this.highlightNode.active = true;
      this.highlightNode.setPosition(step.highlightArea.x, step.highlightArea.y, 0);
      this.highlightNode.setScale(step.highlightArea.width / 100, step.highlightArea.height / 100, 1);
      
      const intensity = SettingsManager.getInstance().animationIntensity;
      if (intensity > 0) {
        tween(this.highlightNode)
          .to(0.5 * intensity, { scale: new Vec3(step.highlightArea.width / 90, step.highlightArea.height / 90, 1) })
          .to(0.5 * intensity, { scale: new Vec3(step.highlightArea.width / 100, step.highlightArea.height / 100, 1) })
          .union()
          .repeatForever()
          .start();
      }
    } else {
      this.highlightNode.active = false;
      tween(this.highlightNode).stop();
    }
  }

  private updateArrow(step: TutorialStep): void {
    if (!this.arrowNode || !step.highlightArea) {
      if (this.arrowNode) {
        this.arrowNode.active = false;
      }
      return;
    }

    this.arrowNode.active = true;
    const arrowX = step.highlightArea.x;
    const arrowY = step.highlightArea.y - step.highlightArea.height / 2 - 30;
    this.arrowNode.setPosition(arrowX, arrowY, 0);
  }

  private scheduleNextStep(delay: number): void {
    const intensity = SettingsManager.getInstance().animationIntensity;
    const actualDelay = delay * intensity;
    
    setTimeout(() => {
      if (this._running && this._currentStep < TUTORIAL_STEPS.length - 1) {
        this.nextStep();
      }
    }, actualDelay * 1000);
  }

  nextStep(): void {
    if (!this._running) return;
    
    EventBus.instance.emit(GameEvents.TUTORIAL_STEP, this._currentStep, true);
    AnalyticsService.getInstance().trackTutorialStep(this._currentStep, true);
    
    if (this._currentStep >= TUTORIAL_STEPS.length - 1) {
      this.completeTutorial();
    } else {
      this.showStep(this._currentStep + 1);
    }
  }

  skipTutorial(): void {
    this.completeTutorial();
  }

  private completeTutorial(): void {
    this._completed = true;
    this._running = false;
    this._waitingForAction = false;

    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save tutorial status:', e);
    }

    EventBus.instance.emit('tutorial_completed');
    
    if (this.tutorialContainer) {
      const intensity = SettingsManager.getInstance().animationIntensity;
      
      if (intensity > 0) {
        const opacity = this.tutorialContainer.getComponent(UIOpacity);
        tween(opacity)
          .to(0.2 * intensity, { opacity: 0 })
          .call(() => {
            this.tutorialContainer!.active = false;
          })
          .start();
      } else {
        this.tutorialContainer.active = false;
      }
    }

    EventBus.instance.off(GameEvents.COURSE_DRAG_END, this.onCourseDragEnd.bind(this));
    EventBus.instance.off(GameEvents.COURSE_PLACED, this.onCoursePlaced.bind(this));
  }

  private onCourseDragEnd(): void {
    if (!this._running || !this._waitingForAction) return;
    
    const step = TUTORIAL_STEPS[this._currentStep];
    if (step.action === 'course_dragged') {
      this.nextStep();
    }
  }

  private onCoursePlaced(): void {
    if (!this._running || !this._waitingForAction) return;
    
    const step = TUTORIAL_STEPS[this._currentStep];
    if (step.action === 'drag_course') {
      this.nextStep();
    }
  }

  triggerAction(action: string): void {
    if (!this._running || !this._waitingForAction) return;
    
    const step = TUTORIAL_STEPS[this._currentStep];
    if (step.action === action) {
      this.nextStep();
    }
  }

  reset(): void {
    this._currentStep = 0;
    this._running = false;
    this._waitingForAction = false;
    this._completed = false;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset tutorial status:', e);
    }
  }
}
