import { UIBase } from './UIBase';
import { TutorialManager, TutorialStep } from '../managers/TutorialManager';
import { EventManager, GameEvents } from '../utils/EventManager';

export class TutorialUI extends UIBase {
  private _currentStep: TutorialStep | null = null;

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
  }

  private onPhaseChanged(phase: string): void {
    if (TutorialManager.instance.isPlaying) {
      this.refresh();
    }
  }

  public refresh(): void {
    this._currentStep = TutorialManager.instance.currentStep;
    if (!this._currentStep) {
      this.hide();
      return;
    }

    this.show();
    this.setLabelText('stepTitle', this._currentStep.title);
    this.setLabelText('stepContent', this._currentStep.content);
    this.setLabelText('stepIndex', `第 ${TutorialManager.instance.getCurrentStepNumber()} / ${TutorialManager.instance.getTotalSteps()} 步`);

    const prevBtn = this.node?.getChildByName('prevBtn');
    if (prevBtn) {
      prevBtn.active = TutorialManager.instance.getCurrentStepNumber() > 1;
    }

    const nextBtn = this.node?.getChildByName('nextBtn');
    if (nextBtn) {
      const isLastStep = TutorialManager.instance.getCurrentStepNumber() >= TutorialManager.instance.getTotalSteps();
      const finishLabel = nextBtn.getChildByName('label');
      if (finishLabel && finishLabel.getComponent) {
        const label = finishLabel.getComponent(cc.Label);
        if (label) {
          label.string = isLastStep ? '完成' : '下一步';
        }
      }
    }
  }

  public onPrevClick(): void {
    TutorialManager.instance.prevStep();
    this.refresh();
  }

  public onNextClick(): void {
    if (TutorialManager.instance.getCurrentStepNumber() >= TutorialManager.instance.getTotalSteps()) {
      this.onComplete();
    } else {
      TutorialManager.instance.nextStep();
      this.refresh();
    }
  }

  public onSkipClick(): void {
    TutorialManager.instance.stopTutorial();
    this.hide();
  }

  public onComplete(): void {
    TutorialManager.instance.completeTutorial();
    this.hide();
  }

  private setLabelText(labelName: string, text: string): void {
    if (!this.node) return;
    const label = this.node.getChildByName(labelName);
    if (label && label.getComponent) {
      const labelComp = label.getComponent(cc.Label);
      if (labelComp) {
        labelComp.string = text;
      }
    }
  }
}
