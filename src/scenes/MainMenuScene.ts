import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';

export class MainMenuScene extends BaseScene {
  private titleContainer: Phaser.GameObjects.Container | null = null;
  private buttonsContainer: Phaser.GameObjects.Container | null = null;
  private menuButtons: Map<string, UIElement> = new Map();

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    super.create();

    this.createBackground(true);
    this.createDecorativeElements();
    this.createGameTitle();
    this.createMenuButtons();
    this.createFooter();
    this.playBackgroundMusic();

    this.fadeIn(600);
  }

  private createDecorativeElements(): void {
    const { width, height } = this.scale;

    const blueprintGraphics = this.add.graphics();
    blueprintGraphics.lineStyle(1, COLORS.ACCENT, 0.08);

    for (let i = 0; i < 5; i++) {
      const cx = width * (0.1 + Math.random() * 0.8);
      const cy = height * (0.2 + Math.random() * 0.6);
      const radius = 50 + Math.random() * 150;

      blueprintGraphics.beginPath();
      blueprintGraphics.arc(cx, cy, radius, 0, Math.PI * 2);
      blueprintGraphics.strokePath();

      blueprintGraphics.beginPath();
      blueprintGraphics.moveTo(cx - radius, cy);
      blueprintGraphics.lineTo(cx + radius, cy);
      blueprintGraphics.moveTo(cx, cy - radius);
      blueprintGraphics.lineTo(cx, cy + radius);
      blueprintGraphics.strokePath();
    }

    const scanLine = this.add.graphics();
    scanLine.fillStyle(COLORS.ACCENT, 0.03);
    scanLine.fillRect(0, 0, width, 4);

    this.tweens.add({
      targets: scanLine,
      y: { from: 0, to: height },
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    });

    const cornerDecorTL = this.add.graphics();
    cornerDecorTL.lineStyle(2, COLORS.ACCENT, 0.6);
    cornerDecorTL.beginPath();
    cornerDecorTL.moveTo(30, 60);
    cornerDecorTL.lineTo(30, 30);
    cornerDecorTL.lineTo(60, 30);
    cornerDecorTL.strokePath();

    const cornerDecorTR = this.add.graphics();
    cornerDecorTR.lineStyle(2, COLORS.ACCENT, 0.6);
    cornerDecorTR.beginPath();
    cornerDecorTR.moveTo(width - 30, 60);
    cornerDecorTR.lineTo(width - 30, 30);
    cornerDecorTR.lineTo(width - 60, 30);
    cornerDecorTR.strokePath();

    const cornerDecorBL = this.add.graphics();
    cornerDecorBL.lineStyle(2, COLORS.ACCENT, 0.6);
    cornerDecorBL.beginPath();
    cornerDecorBL.moveTo(30, height - 60);
    cornerDecorBL.lineTo(30, height - 30);
    cornerDecorBL.lineTo(60, height - 30);
    cornerDecorBL.strokePath();

    const cornerDecorBR = this.add.graphics();
    cornerDecorBR.lineStyle(2, COLORS.ACCENT, 0.6);
    cornerDecorBR.beginPath();
    cornerDecorBR.moveTo(width - 30, height - 60);
    cornerDecorBR.lineTo(width - 30, height - 30);
    cornerDecorBR.lineTo(width - 60, height - 30);
    cornerDecorBR.strokePath();
  }

  private createGameTitle(): void {
    const { width, height } = this.scale;

    this.titleContainer = this.add.container(width / 2, height * 0.25);

    const titleBg = this.add.graphics();
    titleBg.fillStyle(COLORS.PRIMARY, 0.6);
    titleBg.lineStyle(3, COLORS.ACCENT, 1);

    const titleWidth = 500;
    const titleHeight = 140;

    titleBg.beginPath();
    titleBg.moveTo(-titleWidth / 2, -titleHeight / 2 + 15);
    titleBg.lineTo(-titleWidth / 2 + 15, -titleHeight / 2);
    titleBg.lineTo(titleWidth / 2 - 15, -titleHeight / 2);
    titleBg.lineTo(titleWidth / 2, -titleHeight / 2 + 15);
    titleBg.lineTo(titleWidth / 2, titleHeight / 2 - 15);
    titleBg.lineTo(titleWidth / 2 - 15, titleHeight / 2);
    titleBg.lineTo(-titleWidth / 2 + 15, titleHeight / 2);
    titleBg.lineTo(-titleWidth / 2, titleHeight / 2 - 15);
    titleBg.closePath();
    titleBg.fillPath();
    titleBg.strokePath();

    const titleAccentTop = this.add.rectangle(
      0,
      -titleHeight / 2 + 25,
      titleWidth * 0.8,
      4,
      COLORS.ACCENT
    );
    const titleAccentBottom = this.add.rectangle(
      0,
      titleHeight / 2 - 25,
      titleWidth * 0.8,
      4,
      COLORS.ACCENT
    );

    const mainTitle = this.add
      .text(0, -15, '工地指挥家', {
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    mainTitle.setLetterSpacing(8);

    const subtitle = this.add
      .text(0, 35, '设计变更经营模拟', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: `#${COLORS.ACCENT.toString(16).padStart(6, '0')}`,
        fontStyle: '500',
      })
      .setOrigin(0.5);
    subtitle.setLetterSpacing(4);

    this.titleContainer.add([
      titleBg,
      titleAccentTop,
      titleAccentBottom,
      mainTitle,
      subtitle,
    ]);

    this.titleContainer.setAlpha(0);
    this.titleContainer.setY(height * 0.2);

    this.tweens.add({
      targets: this.titleContainer,
      alpha: 1,
      y: height * 0.25,
      duration: 1000,
      delay: 200,
      ease: 'Power3.easeOut',
    });
  }

  private createMenuButtons(): void {
    const { width, height } = this.scale;

    this.buttonsContainer = this.add.container(width / 2, height * 0.55);

    const buttonWidth = 280;
    const buttonHeight = 55;
    const buttonSpacing = 75;
    const startY = -buttonSpacing * 2;

    const hasSaveData = this.saveSystem.hasSaveData();
    const hasCompletedTutorial = this.saveSystem.getCurrentSave()?.tutorialCompleted ?? false;

    const buttonConfigs = [
      {
        id: 'newGame',
        text: '开始新游戏',
        variant: 'primary' as const,
        y: startY,
        onClick: () => this.handleNewGame(),
        disabled: false,
      },
      {
        id: 'continue',
        text: '继续游戏',
        variant: 'secondary' as const,
        y: startY + buttonSpacing,
        onClick: () => this.handleContinue(),
        disabled: !hasSaveData,
      },
      {
        id: 'tutorial',
        text: hasCompletedTutorial ? '重新教程' : '新手教程',
        variant: 'secondary' as const,
        y: startY + buttonSpacing * 2,
        onClick: () => this.handleTutorial(),
        disabled: false,
      },
      {
        id: 'leaderboard',
        text: '排行榜',
        variant: 'outline' as const,
        y: startY + buttonSpacing * 3,
        onClick: () => this.handleLeaderboard(),
        disabled: false,
      },
      {
        id: 'settings',
        text: '设置',
        variant: 'outline' as const,
        y: startY + buttonSpacing * 4,
        onClick: () => this.handleSettings(),
        disabled: false,
      },
    ];

    buttonConfigs.forEach((config, index) => {
      const button = this.createButton({
        x: 0,
        y: config.y,
        width: buttonWidth,
        height: buttonHeight,
        text: config.text,
        fontSize: 20,
        variant: config.variant,
        disabled: config.disabled,
        onClick: config.onClick,
      });

      button.container.setAlpha(0);
      button.container.setX(-50);

      this.tweens.add({
        targets: button.container,
        alpha: 1,
        x: 0,
        duration: 600,
        delay: 500 + index * 100,
        ease: 'Power3.easeOut',
      });

      this.menuButtons.set(config.id, button);
      this.buttonsContainer!.add(button.container);
    });
  }

  private createFooter(): void {
    const { width, height } = this.scale;

    const currentSave = this.saveSystem.getCurrentSave();

    if (currentSave) {
      const scoreText = this.createText(
        width - 30,
        height - 25,
        `累计得分: ${currentSave.totalScore}`,
        {
          fontSize: 14,
          color: COLORS.TEXT_SECONDARY,
          origin: { x: 1, y: 0.5 },
        }
      );

      const playerText = this.createText(
        30,
        height - 25,
        `玩家: ${currentSave.playerName}`,
        {
          fontSize: 14,
          color: COLORS.TEXT_SECONDARY,
          origin: { x: 0, y: 0.5 },
        }
      );

      [scoreText, playerText].forEach((text, index) => {
        text.setAlpha(0);
        this.tweens.add({
          targets: text,
          alpha: 1,
          duration: 800,
          delay: 1200 + index * 100,
        });
      });
    }

    const versionText = this.createText(width / 2, height - 25, 'v1.0.0', {
      fontSize: 12,
      color: COLORS.TEXT_DISABLED,
      origin: { x: 0.5, y: 0.5 },
    });
    versionText.setAlpha(0);
    this.tweens.add({
      targets: versionText,
      alpha: 1,
      duration: 800,
      delay: 1300,
    });
  }

  private playBackgroundMusic(): void {
    try {
      this.audioManager.playMusic('menu_music');
    } catch (error) {
      console.warn('[MainMenuScene] Failed to play background music:', error);
    }
  }

  private handleNewGame(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });

    const currentSave = this.saveSystem.getCurrentSave();
    if (currentSave && currentSave.completedTasks.length > 0) {
      this.showConfirmDialog(
        '开始新游戏将覆盖当前进度，是否继续？',
        () => {
          this.saveSystem.reset();
          const gameConfig = this.configManager.getGameConfig();
          this.saveSystem.init(gameConfig.defaultSettings);
          this.startGame();
        }
      );
    } else {
      this.startGame();
    }
  }

  private handleContinue(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.startGame();
  }

  private handleTutorial(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.transitionToScene('TutorialScene');
  }

  private handleLeaderboard(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.transitionToScene('LeaderboardScene');
  }

  private handleSettings(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.showSettingsPanel();
  }

  private startGame(): void {
    const currentSave = this.saveSystem.getCurrentSave();
    if (currentSave && !currentSave.tutorialCompleted) {
      this.transitionToScene('TutorialScene');
    } else {
      this.transitionToScene('TaskHallScene');
    }
  }

  private showConfirmDialog(
    message: string,
    onConfirm: () => void
  ): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    overlay.setDepth(100);

    const panel = this.createPanel(width / 2, height / 2, 450, 200, '确认');
    panel.setDepth(101);

    const messageText = this.createText(width / 2, height / 2 - 10, message, {
      fontSize: 18,
      color: COLORS.TEXT,
    });
    messageText.setDepth(102);
    messageText.setWordWrapWidth(400);

    const confirmButton = this.createButton({
      x: width / 2 - 80,
      y: height / 2 + 60,
      width: 130,
      height: 45,
      text: '确认',
      variant: 'primary',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        messageText.destroy();
        confirmButton.destroy();
        cancelButton.destroy();
        onConfirm();
      },
    });
    confirmButton.container.setDepth(102);

    const cancelButton = this.createButton({
      x: width / 2 + 80,
      y: height / 2 + 60,
      width: 130,
      height: 45,
      text: '取消',
      variant: 'secondary',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        messageText.destroy();
        confirmButton.destroy();
        cancelButton.destroy();
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
      },
    });
    cancelButton.container.setDepth(102);
  }

  private showSettingsPanel(): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.7
    );
    overlay.setDepth(100);

    const panel = this.createPanel(width / 2, height / 2, 500, 400, '游戏设置');
    panel.setDepth(101);

    const settings = this.saveSystem.getSettings();

    let soundVolume = settings?.soundVolume ?? 0.7;
    let musicVolume = settings?.musicVolume ?? 0.5;

    const soundLabel = this.createText(
      width / 2 - 200,
      height / 2 - 100,
      '音效音量',
      {
        fontSize: 18,
        color: COLORS.TEXT,
        origin: { x: 0, y: 0.5 },
      }
    );
    soundLabel.setDepth(102);

    const soundValue = this.createText(
      width / 2 + 200,
      height / 2 - 100,
      `${Math.round(soundVolume * 100)}%`,
      {
        fontSize: 18,
        color: COLORS.ACCENT,
        origin: { x: 1, y: 0.5 },
      }
    );
    soundValue.setDepth(102);

    const soundBarBg = this.add.rectangle(
      width / 2,
      height / 2 - 60,
      380,
      12,
      COLORS.PANEL_BORDER
    );
    soundBarBg.setDepth(102);

    const soundBarFill = this.add.rectangle(
      width / 2 - 190 + (380 * soundVolume) / 2,
      height / 2 - 60,
      380 * soundVolume,
      8,
      COLORS.ACCENT
    );
    soundBarFill.setDepth(102);

    const musicLabel = this.createText(
      width / 2 - 200,
      height / 2,
      '音乐音量',
      {
        fontSize: 18,
        color: COLORS.TEXT,
        origin: { x: 0, y: 0.5 },
      }
    );
    musicLabel.setDepth(102);

    const musicValue = this.createText(
      width / 2 + 200,
      height / 2,
      `${Math.round(musicVolume * 100)}%`,
      {
        fontSize: 18,
        color: COLORS.ACCENT,
        origin: { x: 1, y: 0.5 },
      }
    );
    musicValue.setDepth(102);

    const musicBarBg = this.add.rectangle(
      width / 2,
      height / 2 + 40,
      380,
      12,
      COLORS.PANEL_BORDER
    );
    musicBarBg.setDepth(102);

    const musicBarFill = this.add.rectangle(
      width / 2 - 190 + (380 * musicVolume) / 2,
      height / 2 + 40,
      380 * musicVolume,
      8,
      COLORS.ACCENT
    );
    musicBarFill.setDepth(102);

    soundBarBg.setInteractive({ useHandCursor: true });
    soundBarBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const rect = soundBarBg.getBounds();
      const newVolume = Math.max(0, Math.min(1, (pointer.x - rect.left) / rect.width));
      soundVolume = newVolume;
      soundValue.setText(`${Math.round(soundVolume * 100)}%`);
      soundBarFill.width = 380 * soundVolume;
      soundBarFill.x = width / 2 - 190 + (380 * soundVolume) / 2;
      this.saveSystem.updateSettings({ soundVolume });
      this.audioManager.setVolume('sfx', soundVolume);
    });

    musicBarBg.setInteractive({ useHandCursor: true });
    musicBarBg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const rect = musicBarBg.getBounds();
      const newVolume = Math.max(0, Math.min(1, (pointer.x - rect.left) / rect.width));
      musicVolume = newVolume;
      musicValue.setText(`${Math.round(musicVolume * 100)}%`);
      musicBarFill.width = 380 * musicVolume;
      musicBarFill.x = width / 2 - 190 + (380 * musicVolume) / 2;
      this.saveSystem.updateSettings({ musicVolume });
      this.audioManager.setVolume('music', musicVolume);
    });

    const closeButton = this.createButton({
      x: width / 2,
      y: height / 2 + 140,
      width: 160,
      height: 50,
      text: '关闭',
      variant: 'primary',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        soundLabel.destroy();
        soundValue.destroy();
        soundBarBg.destroy();
        soundBarFill.destroy();
        musicLabel.destroy();
        musicValue.destroy();
        musicBarBg.destroy();
        musicBarFill.destroy();
        closeButton.destroy();
      },
    });
    closeButton.container.setDepth(102);
  }

  protected setupEventListeners(): void {
    this.addEventListener(GameEvent.SETTINGS_CHANGED, (data: unknown) => {
      console.log('[MainMenuScene] Settings updated:', data);
    });
  }

  destroy(): void {
    this.audioManager.stopMusic();
    super.destroy();
  }
}
