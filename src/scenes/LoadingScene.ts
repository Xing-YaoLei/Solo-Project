import { Scene } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../types';
import { LOADING_TIPS } from '../data/questionBank';
import { getRandomItem } from '../utils';
import { gameStateManager } from '../utils/GameStateManager';
import { UIProgressBar } from '../components/UIProgressBar';

export class LoadingScene extends Scene {
  private progressBar: UIProgressBar | null = null;
  private tipText: Phaser.GameObjects.Text | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private loadingProgress: number = 0;
  private simulatedLoadTime: number = 2000;
  private elapsedTime: number = 0;
  private currentTip: string = '';
  private tipChangeTimer: number = 0;
  private tipChangeInterval: number = 3000;

  constructor() {
    super('LoadingScene');
  }

  preload(): void {
    this.createUI();
    this.simulateLoading();
  }

  create(): void {
    gameStateManager.setPhase('loading');
  }

  private createUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.titleText = this.add.text(centerX, centerY - 120, '📚 教务评教模拟器', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.progressBar = new UIProgressBar(
      this,
      centerX - 250,
      centerY,
      500,
      30,
      COLORS.primary,
      false,
      true
    ).setShowPercentage(true);

    this.tipText = this.add.text(centerX, centerY + 60, '', {
      fontSize: '16px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: 600 }
    }).setOrigin(0.5, 0.5);

    this.currentTip = getRandomItem(LOADING_TIPS);
    this.tipText.setText(this.currentTip);

    const versionText = this.add.text(GAME_WIDTH - 20, GAME_HEIGHT - 20, 'v1.0.0', {
      fontSize: '12px',
      color: '#718096',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(1, 1);

    this.add.existing(versionText);
  }

  private simulateLoading(): void {
    const loadSteps = [
      { progress: 20, duration: 400, text: '正在加载资源...' },
      { progress: 45, duration: 500, text: '正在初始化关卡数据...' },
      { progress: 70, duration: 400, text: '正在准备学生信息...' },
      { progress: 90, duration: 300, text: '正在启动游戏引擎...' },
      { progress: 100, duration: 200, text: '加载完成！' }
    ];

    let currentStep = 0;
    let stepStartTime = 0;

    const updateProgress = (time: number, delta: number) => {
      if (currentStep >= loadSteps.length) {
        this.time.removeAllEvents();
        this.onLoadingComplete();
        return;
      }

      const step = loadSteps[currentStep];
      stepStartTime += delta;

      const stepProgress = Math.min(1, stepStartTime / step.duration);
      const prevProgress = currentStep > 0 ? loadSteps[currentStep - 1].progress : 0;
      const displayProgress = prevProgress + (step.progress - prevProgress) * stepProgress;

      this.loadingProgress = displayProgress;
      this.progressBar?.setValue(displayProgress);

      if (stepStartTime >= step.duration) {
        currentStep++;
        stepStartTime = 0;
      }

      this.tipChangeTimer += delta;
      if (this.tipChangeTimer >= this.tipChangeInterval) {
        this.tipChangeTimer = 0;
        this.animateTipChange();
      }
    };

    this.time.addEvent({
      delay: 16,
      callback: updateProgress,
      loop: true
    });
  }

  private animateTipChange(): void {
    if (!this.tipText) return;

    this.tweens.add({
      targets: this.tipText,
      alpha: 0,
      duration: 300,
      ease: 'Power2.in',
      onComplete: () => {
        this.currentTip = getRandomItem(LOADING_TIPS);
        this.tipText?.setText(this.currentTip);
        this.tweens.add({
          targets: this.tipText,
          alpha: 1,
          duration: 300,
          ease: 'Power2.out'
        });
      }
    });
  }

  private onLoadingComplete(): void {
    this.cameras.main.fadeOut(500, 26, 32, 44);

    this.time.delayedCall(500, () => {
      this.scene.start('MenuScene');
    });
  }

  update(time: number, delta: number): void {
    this.elapsedTime += delta;
  }
}
