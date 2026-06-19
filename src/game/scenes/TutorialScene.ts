import Phaser from 'phaser';
import { GAME_CONFIG, TUTORIAL_STEPS } from '@/config/constants';
import { InputManager } from '@/game/systems/InputManager';
import { setTutorialComplete } from '@/utils/Storage';

export class TutorialScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private currentStep: number = 0;
  private stepLabel!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private icon!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private description!: Phaser.GameObjects.Text;
  private prevText!: Phaser.GameObjects.Text;
  private nextText!: Phaser.GameObjects.Text;

  constructor() {
    super('Tutorial');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BG);
    this.inputManager = new InputManager(this);

    this.createHeader();
    this.createStepDisplay();
    this.createNavigation();
    this.updateStepContent();
    this.setupKeyboardControls();
  }

  private createHeader(): void {
    const { width } = this.scale;

    const backBtn = this.add.text(30, 35, '← 返回菜单', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#94A3B8'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('Menu'));

    this.add.text(width / 2, 35, '📖 新手引导', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    }).setOrigin(0.5);
  }

  private createStepDisplay(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2 - 30;

    const cardW = 600;
    const cardH = 400;

    const cardBg = this.add.rectangle(cx, cy, cardW, cardH, GAME_CONFIG.COLORS.PRIMARY, 0.95)
      .setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT, 0.5);

    const progressBg = this.add.rectangle(cx, cy - 150, cardW - 60, 8, GAME_CONFIG.COLORS.BG, 0.5);
    this.progressBar = this.add.rectangle(cx - (cardW - 60) / 2, cy - 150, 0, 8, GAME_CONFIG.COLORS.ACCENT, 1)
      .setOrigin(0, 0.5);

    this.stepLabel = this.add.text(cx - cardW / 2 + 30, cy - 190, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#E85D04'
    });

    const tips: Record<string, string> = {
      welcome: '🎮',
      vehicleCard: '🚗',
      diagnosisPanel: '🔍',
      workOrderList: '📋',
      submitButton: '✔️'
    };

    this.icon = this.add.text(cx, cy - 80, '', { fontSize: '80px' }).setOrigin(0.5);
    this.icon.setData('tips', tips);

    this.title = this.add.text(cx, cy + 20, '', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    }).setOrigin(0.5);

    this.description = this.add.text(cx, cy + 80, '', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      color: '#94A3B8',
      align: 'center',
      wordWrap: { width: cardW - 80 }
    }).setOrigin(0.5, 0);
  }

  private createNavigation(): void {
    const { width, height } = this.scale;
    const y = height - 100;

    const prevBtnBg = this.add.rectangle(width / 2 - 200, y + 28, 160, 56, GAME_CONFIG.COLORS.METAL_DARK, 0.8)
      .setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.5);

    this.prevText = this.add.text(width / 2 - 200, y + 28, '← 上一步', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: '600',
      color: '#94A3B8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.prevText.on('pointerdown', () => this.prevStep());

    const nextBtnBg = this.add.rectangle(width / 2 + 200, y + 28, 160, 56, GAME_CONFIG.COLORS.ACCENT, 1);

    this.nextText = this.add.text(width / 2 + 200, y + 28, '下一步 →', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.nextText.on('pointerdown', () => this.nextStep());
  }

  private updateStepContent(): void {
    const step = TUTORIAL_STEPS[this.currentStep];
    if (!step) return;

    const tips = this.icon.getData('tips') as Record<string, string>;

    this.stepLabel.setText(`第 ${this.currentStep + 1} 步 / 共 ${TUTORIAL_STEPS.length} 步`);

    const progress = (this.currentStep + 1) / TUTORIAL_STEPS.length;
    this.tweens.add({
      targets: this.progressBar,
      width: 540 * progress,
      duration: 300,
      ease: 'Sine.easeOut'
    });

    this.icon.setText(tips[step.target] || '📘');
    this.title.setText(step.title);
    this.description.setText(step.desc);

    this.prevText.setAlpha(this.currentStep > 0 ? 1 : 0.3);
    this.nextText.setText(
      this.currentStep === TUTORIAL_STEPS.length - 1 ? '开始游戏 ✔' : '下一步 →'
    );

    this.tweens.add({
      targets: [this.icon, this.title, this.description],
      alpha: { from: 0, to: 1, duration: 300 },
      ease: 'Sine.easeOut'
    });
  }

  private setupKeyboardControls(): void {
    this.inputManager.onKeys(['ArrowLeft', 'a', 'A'], () => this.prevStep());
    this.inputManager.onKeys(['ArrowRight', 'd', 'D', 'Enter', ' '], () => this.nextStep());
    this.inputManager.onKey('Escape', () => this.scene.start('Menu'));
  }

  private prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateStepContent();
    }
  }

  private nextStep(): void {
    if (this.currentStep < TUTORIAL_STEPS.length - 1) {
      this.currentStep++;
      this.updateStepContent();
    } else {
      setTutorialComplete(true);
      this.scene.start('Game');
    }
  }
}
