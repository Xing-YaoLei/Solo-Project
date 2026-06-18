import { BaseScene, COLORS, FONT_FAMILY } from './BaseScene';

export class BootScene extends BaseScene {
  private progressBar: Phaser.GameObjects.Graphics | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private totalSteps = 5;
  private currentStep = 0;

  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.createBootUI();
    this.startLoading();
  }

  private createBootUI(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

    const logoContainer = this.add.container(width / 2, height * 0.35);

    const logoBg = this.add.graphics();
    logoBg.fillStyle(COLORS.PRIMARY, 1);
    logoBg.lineStyle(3, COLORS.ACCENT, 1);

    const logoWidth = 200;
    const logoHeight = 200;
    logoBg.beginPath();
    logoBg.moveTo(-logoWidth / 2, -logoHeight / 2 + 20);
    logoBg.lineTo(-logoWidth / 2 + 20, -logoHeight / 2);
    logoBg.lineTo(logoWidth / 2 - 20, -logoHeight / 2);
    logoBg.lineTo(logoWidth / 2, -logoHeight / 2 + 20);
    logoBg.lineTo(logoWidth / 2, logoHeight / 2 - 20);
    logoBg.lineTo(logoWidth / 2 - 20, logoHeight / 2);
    logoBg.lineTo(-logoWidth / 2 + 20, logoHeight / 2);
    logoBg.lineTo(-logoWidth / 2, logoHeight / 2 - 20);
    logoBg.closePath();
    logoBg.fillPath();
    logoBg.strokePath();

    const logoAccent = this.add.graphics();
    logoAccent.lineStyle(2, COLORS.ACCENT, 0.8);
    logoAccent.beginPath();
    logoAccent.moveTo(-logoWidth / 2 + 40, -logoHeight / 2 + 40);
    logoAccent.lineTo(logoWidth / 2 - 40, -logoHeight / 2 + 40);
    logoAccent.moveTo(-logoWidth / 2 + 40, logoHeight / 2 - 40);
    logoAccent.lineTo(logoWidth / 2 - 40, logoHeight / 2 - 40);
    logoAccent.strokePath();

    const gameTitle = this.add
      .text(0, -30, '工地指挥家', {
        fontFamily: FONT_FAMILY,
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const gameSubtitle = this.add
      .text(0, 20, '设计变更经营模拟', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: `#${COLORS.ACCENT.toString(16).padStart(6, '0')}`,
        fontStyle: '500',
      })
      .setOrigin(0.5);

    const versionText = this.add
      .text(0, 55, 'v1.0.0', {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5);

    logoContainer.add([
      logoBg,
      logoAccent,
      gameTitle,
      gameSubtitle,
      versionText,
    ]);

    this.tweens.add({
      targets: logoContainer,
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.easeOut',
    });

    const progressBarWidth = 400;
    const progressBarHeight = 12;
    const progressBarY = height * 0.65;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(COLORS.PANEL, 1);
    progressBg.lineStyle(2, COLORS.PANEL_BORDER, 1);
    progressBg.beginPath();
    progressBg.moveTo(-progressBarWidth / 2, -progressBarHeight / 2);
    progressBg.lineTo(progressBarWidth / 2, -progressBarHeight / 2);
    progressBg.lineTo(progressBarWidth / 2, progressBarHeight / 2);
    progressBg.lineTo(-progressBarWidth / 2, progressBarHeight / 2);
    progressBg.closePath();
    progressBg.fillPath();
    progressBg.strokePath();
    progressBg.setPosition(width / 2, progressBarY);

    const progressBarCorners = this.add.graphics();
    progressBarCorners.lineStyle(2, COLORS.ACCENT, 1);
    const cornerSize = 6;
    progressBarCorners.beginPath();
    progressBarCorners.moveTo(
      width / 2 - progressBarWidth / 2 + cornerSize,
      progressBarY - progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 - progressBarWidth / 2,
      progressBarY - progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 - progressBarWidth / 2,
      progressBarY - progressBarHeight / 2 + cornerSize
    );
    progressBarCorners.moveTo(
      width / 2 + progressBarWidth / 2 - cornerSize,
      progressBarY - progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 + progressBarWidth / 2,
      progressBarY - progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 + progressBarWidth / 2,
      progressBarY - progressBarHeight / 2 + cornerSize
    );
    progressBarCorners.moveTo(
      width / 2 - progressBarWidth / 2 + cornerSize,
      progressBarY + progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 - progressBarWidth / 2,
      progressBarY + progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 - progressBarWidth / 2,
      progressBarY + progressBarHeight / 2 - cornerSize
    );
    progressBarCorners.moveTo(
      width / 2 + progressBarWidth / 2 - cornerSize,
      progressBarY + progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 + progressBarWidth / 2,
      progressBarY + progressBarHeight / 2
    );
    progressBarCorners.lineTo(
      width / 2 + progressBarWidth / 2,
      progressBarY + progressBarHeight / 2 - cornerSize
    );
    progressBarCorners.strokePath();

    this.progressBar = this.add.graphics();
    this.progressBar.setPosition(width / 2, progressBarY);

    this.progressText = this.add
      .text(width / 2, progressBarY - 30, '0%', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, progressBarY + 35, '正在初始化...', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
      })
      .setOrigin(0.5);

    const gridSize = 40;
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, COLORS.PANEL_BORDER, 0.1);

    for (let x = 0; x <= width; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, height);
      gridGraphics.strokePath();
    }

    for (let y = 0; y <= height; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(width, y);
      gridGraphics.strokePath();
    }
  }

  private async startLoading(): Promise<void> {
    try {
      await this.updateProgress(1, '加载游戏配置...');
      await this.configManager.preload('gameConfig');
      const gameConfig = this.configManager.getGameConfig();

      await this.updateProgress(2, '初始化存档系统...');
      this.saveSystem.init(gameConfig.defaultSettings);

      await this.updateProgress(3, '加载关卡数据...');
      await this.configManager.preload('level');

      await this.updateProgress(4, '加载任务数据...');
      await this.configManager.preload('task');

      await this.updateProgress(5, '初始化音频系统...');
      await this.audioManager.init();

      await this.updateProgress(5, '准备就绪！');
      this.time.delayedCall(500, () => {
        this.transitionToScene('MainMenuScene');
      });
    } catch (error) {
      console.error('[BootScene] Loading failed:', error);
      if (this.statusText) {
        this.statusText.setText('加载失败，请刷新页面重试');
        this.statusText.setColor(
          `#${COLORS.ERROR.toString(16).padStart(6, '0')}`
        );
      }
    }
  }

  private async updateProgress(
    step: number,
    status: string
  ): Promise<void> {
    this.currentStep = step;
    const progress = step / this.totalSteps;

    if (this.statusText) {
      this.statusText.setText(status);
    }

    if (this.progressText) {
      this.progressText.setText(`${Math.round(progress * 100)}%`);
    }

    this.animateProgressBar(progress);

    await this.delay(300);
  }

  private animateProgressBar(targetProgress: number): void {
    if (!this.progressBar) return;

    const progressBarWidth = 400;
    const progressBarHeight = 12;
    const currentProgress = { value: this.currentStep - 1 / this.totalSteps };

    this.tweens.add({
      targets: currentProgress,
      value: targetProgress,
      duration: 250,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        if (!this.progressBar) return;
        this.progressBar.clear();

        const fillWidth = progressBarWidth * currentProgress.value;
        if (fillWidth > 0) {
          this.progressBar.fillStyle(COLORS.ACCENT, 1);

          this.progressBar.beginPath();
          if (fillWidth < progressBarWidth) {
            this.progressBar.moveTo(-progressBarWidth / 2, -progressBarHeight / 2 + 2);
            this.progressBar.lineTo(
              -progressBarWidth / 2 + fillWidth,
              -progressBarHeight / 2 + 2
            );
            this.progressBar.lineTo(
              -progressBarWidth / 2 + fillWidth,
              progressBarHeight / 2 - 2
            );
            this.progressBar.lineTo(-progressBarWidth / 2, progressBarHeight / 2 - 2);
          } else {
            this.progressBar.moveTo(-progressBarWidth / 2 + 2, -progressBarHeight / 2 + 2);
            this.progressBar.lineTo(progressBarWidth / 2 - 2, -progressBarHeight / 2 + 2);
            this.progressBar.lineTo(progressBarWidth / 2 - 2, progressBarHeight / 2 - 2);
            this.progressBar.lineTo(-progressBarWidth / 2 + 2, progressBarHeight / 2 - 2);
          }
          this.progressBar.closePath();
          this.progressBar.fillPath();
        }
      },
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }
}
