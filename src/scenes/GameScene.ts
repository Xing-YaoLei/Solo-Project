import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { COLORS } from '../config/colors';
import { useGameStore } from '../stores/gameStore';
import { ACTION_OPTIONS } from '../data/actions';
import { TUTORIAL_STEPS } from '../data/tutorial';
import type { GameTask, ActionType } from '../types/game';
import { formatTime } from '../utils/scoring';
import { checkImagesCompleteness, hasFollowUpTask } from '../utils/validation';
import Matter from 'matter-js';

export class GameScene extends Phaser.Scene {
  private gameState = useGameStore.getState();
  private currentTask!: GameTask;
  private selectedImageIndex = 0;
  private treatmentPlanExpanded = false;
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private matterEngine!: Matter.Engine;
  private isProcessing = false;
  private tutorialStep = 0;
  private showTutorial = false;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.GAME);

    const state = useGameStore.getState();
    console.log('GameScene.create - Store state:', {
      currentLevel: state.currentLevel?.name,
      hasGameState: !!state.gameState,
      gameStateTasks: state.gameState?.tasks?.length,
      gameStateIndex: state.gameState?.currentTaskIndex
    });

    this.gameState = state;
    this.showTutorial = state.showTutorial;
    this.tutorialStep = state.tutorialStep;

    if (!state.gameState || !state.currentLevel) {
      console.warn('GameScene: Missing game state or level, but continuing anyway');
      // 尝试恢复状态
      if (!state.gameState && state.currentLevel) {
        console.log('GameScene: Attempting to restore game state');
        state.startGame(state.currentLevel, state.showTutorial);
      }
    }

    const currentState = useGameStore.getState();
    if (!currentState.gameState || !currentState.currentLevel) {
      console.error('GameScene: Still missing state after recovery attempt, returning to main menu');
      this.scene.stop(SCENE_KEYS.GAME);
      this.scene.start(SCENE_KEYS.MAIN_MENU);
      return;
    }

    this.currentTask = currentState.gameState.tasks[currentState.gameState.currentTaskIndex];

    this.createBackground();
    this.createStatusBar();
    this.createTaskPanel();
    this.createImageViewer();
    this.createDecisionPanel();
    this.createBackButton();

    if (this.showTutorial) {
      this.createTutorialOverlay();
    }

    this.gameState = useGameStore.getState();
  }

  update(time: number, delta: number): void {
    const state = useGameStore.getState();
    if (state.gameState && !state.gameState.isPaused) {
      state.updateElapsedTime(delta / 1000);
      this.updateStatusBar();
    }
  }

  private createBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      0xF5F7FA,
      0xE8F5E9,
      0xF5F7FA,
      0xE8F5E9
    );
    gradient.fillRect(0, 0, width, height);

    this.add.rectangle(width / 2, 720 / 2 + 10, width, 620, 0xffffff, 0.5);
  }

  private createStatusBar(): void {
    const width = this.cameras.main.width;

    const statusBar = this.add.graphics();
    statusBar.fillStyle(0xffffff, 0.95);
    statusBar.fillRect(0, 0, width, 70);
    statusBar.lineStyle(1, 0xE0E0E0, 1);
    statusBar.moveTo(0, 70);
    statusBar.lineTo(width, 70);
    statusBar.stroke();

    const levelName = this.gameState.currentLevel?.name || '游戏中';
    this.add.text(30, 35, `📋 ${levelName}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    }).setOrigin(0, 0.5);

    const taskCount = this.gameState.gameState?.tasks.length || 0;
    const currentIndex = (this.gameState.gameState?.currentTaskIndex || 0) + 1;
    this.add.text(width / 2, 35, `任务 ${currentIndex}/${taskCount}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      color: COLORS.neutral[600],
    }).setOrigin(0.5, 0.5);

    this.createScoreDisplay(width - 350, 35);
    this.createTimerDisplay(width - 200, 35);
    this.createComboDisplay(width - 80, 35);
  }

  private createScoreDisplay(x: number, y: number): void {
    const container = this.add.container(x, y);

    this.add.text(-60, 0, '得分:', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: COLORS.neutral[600],
    }).setOrigin(1, 0.5);

    const scoreText = this.add.text(-50, 0, this.gameState.gameState?.score.toString() || '0', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: COLORS.primary,
    }).setOrigin(0, 0.5).setName('scoreText');

    container.add([scoreText]);
  }

  private createTimerDisplay(x: number, y: number): void {
    const container = this.add.container(x, y);

    this.add.text(-60, 0, '⏱️', {
      fontSize: '20px',
    }).setOrigin(1, 0.5);

    const timeText = this.add.text(-50, 0, formatTime(this.gameState.gameState?.elapsedTime || 0), {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.neutral[700],
    }).setOrigin(0, 0.5).setName('timerText');

    container.add([timeText]);
  }

  private createComboDisplay(x: number, y: number): void {
    const container = this.add.container(x, y);

    const combo = this.gameState.gameState?.combo || 0;
    const comboText = this.add.text(0, 0, combo > 0 ? `🔥${combo}` : '', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.warning,
    }).setOrigin(0.5, 0.5).setName('comboText');

    container.add([comboText]);
  }

  private updateStatusBar(): void {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const scoreText = this.children.getByName('scoreText') as Phaser.GameObjects.Text;
    const timerText = this.children.getByName('timerText') as Phaser.GameObjects.Text;
    const comboText = this.children.getByName('comboText') as Phaser.GameObjects.Text;

    if (scoreText) {
      scoreText.setText(state.gameState.score.toString());
    }
    if (timerText) {
      const elapsed = state.gameState.elapsedTime;
      timerText.setText(formatTime(elapsed));
      
      if (state.currentLevel && elapsed > state.currentLevel.timeLimit * 0.8) {
        timerText.setColor(COLORS.error);
      }
    }
    if (comboText) {
      const combo = state.gameState.combo;
      comboText.setText(combo > 0 ? `🔥${combo}` : '');
    }
  }

  private createTaskPanel(): void {
    const container = this.add.container(30, 90);
    container.setSize(380, 580);
    container.setName('task-panel');

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(1, 0xE0E0E0, 1);
    bg.fillRoundedRect(0, 0, 380, 580, 16);
    bg.strokeRoundedRect(0, 0, 380, 580, 16);

    this.add.text(20, 20, '👤 患者信息', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    this.add.text(20, 55, `${this.currentTask.patient.avatar} ${this.currentTask.patient.name}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    this.add.text(20, 85, `年龄: ${this.currentTask.patient.age}岁 | 性别: ${this.currentTask.patient.gender === 'male' ? '男' : '女'}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[500],
    });

    this.add.text(20, 110, `病历号: ${this.currentTask.patient.medicalRecord}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[500],
    });

    const divider = this.add.graphics();
    divider.lineStyle(1, 0xE0E0E0, 1);
    divider.moveTo(20, 145);
    divider.lineTo(360, 145);
    divider.stroke();

    this.createTreatmentPlanSection(container, 160);

    const completeness = checkImagesCompleteness(this.currentTask);
    const hasFollowUp = hasFollowUpTask(this.currentTask);

    if (!completeness.complete) {
      this.add.text(20, 540, `⚠️ 缺少影像资料: ${completeness.missingImages.length}项`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '14px',
        color: COLORS.error,
        fontStyle: 'bold',
      });
    }

    if (hasFollowUp) {
      this.add.text(20, 560, `📅 有随访任务: ${this.currentTask.treatmentPlan.followUp?.description}`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '14px',
        color: COLORS.info,
        fontStyle: 'bold',
      });
    }

    container.add([bg, divider]);
  }

  private createTreatmentPlanSection(parent: Phaser.GameObjects.Container, startY: number): void {
    const container = this.add.container(0, startY, parent);
    container.setName('treatment-plan');

    this.add.text(20, 0, '📋 治疗计划', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    this.add.text(20, 30, this.currentTask.treatmentPlan.name, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: COLORS.primary,
    });

    this.add.text(20, 55, this.currentTask.treatmentPlan.description, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: COLORS.neutral[600],
      wordWrap: { width: 340 },
    });

    const expandBtn = this.add.container(340, 15);
    expandBtn.setSize(40, 30);
    expandBtn.setInteractive({ useHandCursor: true });

    const expandBg = this.add.graphics();
    expandBg.fillStyle(0xE3F2FD, 1);
    expandBg.fillRoundedRect(0, 0, 40, 30, 8);

    const expandText = this.add.text(20, 15, this.treatmentPlanExpanded ? '▲' : '▼', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.primary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    expandBtn.add([expandBg, expandText]);

    expandBtn.on('pointerdown', () => {
      this.treatmentPlanExpanded = !this.treatmentPlanExpanded;
      expandText.setText(this.treatmentPlanExpanded ? '▲' : '▼');
      this.updateTreatmentPlanDetails();
    });

    container.add([expandBtn]);

    if (this.treatmentPlanExpanded) {
      this.showTreatmentPlanDetails(container, 85);
    }
  }

  private updateTreatmentPlanDetails(): void {
    const oldDetails = this.children.getByName('treatment-plan-details');
    if (oldDetails) {
      oldDetails.destroy();
    }

    const parent = this.children.getByName('treatment-plan') as Phaser.GameObjects.Container;
    if (parent && this.treatmentPlanExpanded) {
      this.showTreatmentPlanDetails(parent, 85);
    }
  }

  private showTreatmentPlanDetails(parent: Phaser.GameObjects.Container, startY: number): void {
    const detailsContainer = this.add.container(0, startY, parent);
    detailsContainer.setName('treatment-plan-details');

    let y = 0;
    const availableImageIds = this.currentTask.images.map(img => img.id);

    this.currentTask.treatmentPlan.steps.forEach((step) => {
      const stepBg = this.add.graphics();
      stepBg.fillStyle(0xF5F7FA, 1);
      stepBg.fillRoundedRect(20, y, 340, 50, 8);

      this.add.text(35, y + 12, `步骤 ${step.order}: ${step.description}`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: COLORS.neutral[700],
      });

      if (step.requiredImages.length > 0) {
        const hasAllImages = step.requiredImages.every(imgId => availableImageIds.includes(imgId));
        this.add.text(35, y + 32, 
          `📷 需要影像: ${step.requiredImages.length}张 ${hasAllImages ? '✅' : '❌'}`, {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: '11px',
          color: hasAllImages ? COLORS.success : COLORS.error,
        });
      } else {
        this.add.text(35, y + 32, '📷 无需影像', {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: '11px',
          color: COLORS.neutral[400],
        });
      }

      detailsContainer.add([stepBg]);
      y += 60;
    });

    if (this.currentTask.treatmentPlan.followUp) {
      const followUpBg = this.add.graphics();
      followUpBg.fillStyle(0xF3E5F5, 1);
      followUpBg.fillRoundedRect(20, y, 340, 50, 8);

      this.add.text(35, y + 12, `📅 随访任务: ${this.currentTask.treatmentPlan.followUp.description}`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: COLORS.info,
      });

      this.add.text(35, y + 32, `截止日期: ${this.currentTask.treatmentPlan.followUp.dueDate}`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '11px',
        color: COLORS.neutral[600],
      });

      detailsContainer.add([followUpBg]);
    }
  }

  private createImageViewer(): void {
    const container = this.add.container(430, 90);
    container.setSize(520, 400);
    container.setName('image-viewer');

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(1, 0xE0E0E0, 1);
    bg.fillRoundedRect(0, 0, 520, 400, 16);
    bg.strokeRoundedRect(0, 0, 520, 400, 16);

    this.add.text(20, 20, '🖼️ 影像附件', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    if (this.currentTask.images.length === 0) {
      this.add.text(260, 200, '📭 暂无影像附件', {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '18px',
        color: COLORS.neutral[400],
      }).setOrigin(0.5);
    } else {
      this.showMainImage(container);
      this.createThumbnails(container);
    }

    container.add([bg]);
  }

  private showMainImage(parent: Phaser.GameObjects.Container): void {
    const image = this.currentTask.images[this.selectedImageIndex];
    if (!image) return;

    const mainImageContainer = this.add.container(20, 55, parent);
    mainImageContainer.setName('main-image');

    const imgBg = this.add.graphics();
    imgBg.fillStyle(0xF5F7FA, 1);
    imgBg.fillRoundedRect(0, 0, 480, 280, 12);

    this.load.image(`img_${image.id}`, image.url);
    this.load.once('complete', () => {
      const img = this.add.image(240, 140, `img_${image.id}`);
      img.setDisplaySize(460, 260);
      mainImageContainer.add([imgBg, img]);
    });
    this.load.start();

    const descText = this.add.text(10, 295, `[${image.type.toUpperCase()}] ${image.description}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: COLORS.neutral[600],
    });
    parent.add(descText);

    const dateText = this.add.text(470, 295, image.date, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '12px',
      color: COLORS.neutral[400],
    }).setOrigin(1, 0);
    parent.add(dateText);

    if (this.currentTask.images.length > 1) {
      const prevBtn = this.createNavButton(10, 140, '←', () => this.prevImage(), parent);
      const nextBtn = this.createNavButton(490, 140, '→', () => this.nextImage(), parent);
      mainImageContainer.add([prevBtn, nextBtn]);
    }
  }

  private createNavButton(x: number, y: number, label: string, onClick: () => void, parent: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
    const container = this.add.container(x, y, parent);
    container.setSize(40, 50);
    container.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.8);
    bg.fillRoundedRect(0, 0, 40, 50, 8);

    const text = this.add.text(20, 25, label, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: COLORS.neutral[600],
    }).setOrigin(0.5);

    container.add([bg, text]);

    container.on('pointerdown', onClick);

    return container;
  }

  private createThumbnails(parent: Phaser.GameObjects.Container): void {
    const startX = 20;
    const startY = 340;
    const thumbWidth = 80;
    const thumbHeight = 50;
    const spacing = 10;

    this.currentTask.images.forEach((image, index) => {
      const x = startX + index * (thumbWidth + spacing);
      const container = this.add.container(x, startY, parent);
      container.setSize(thumbWidth, thumbHeight);
      container.setInteractive({ useHandCursor: true });

      const bg = this.add.graphics();
      if (index === this.selectedImageIndex) {
        bg.lineStyle(3, parseInt(COLORS.primary.replace('#', ''), 16), 1);
      } else {
        bg.lineStyle(1, 0xE0E0E0, 1);
      }
      bg.fillStyle(0xF5F7FA, 1);
      bg.fillRoundedRect(0, 0, thumbWidth, thumbHeight, 6);
      bg.strokeRoundedRect(0, 0, thumbWidth, thumbHeight, 6);

      this.load.image(`thumb_${image.id}`, image.thumbnail);
      this.load.once('complete', () => {
        const img = this.add.image(thumbWidth / 2, thumbHeight / 2, `thumb_${image.id}`);
        img.setDisplaySize(thumbWidth - 6, thumbHeight - 6);
        container.add([bg, img]);
      });
      this.load.start();

      container.on('pointerdown', () => {
        this.selectedImageIndex = index;
        this.refreshImageViewer();
      });
    });
  }

  private refreshImageViewer(): void {
    const imageViewer = this.children.getByName('image-viewer') as Phaser.GameObjects.Container;
    if (imageViewer) {
      const mainImage = imageViewer.getByName('main-image');
      if (mainImage) {
        mainImage.destroy();
      }
      this.showMainImage(imageViewer);
    }
  }

  private prevImage(): void {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
      this.refreshImageViewer();
    }
  }

  private nextImage(): void {
    if (this.selectedImageIndex < this.currentTask.images.length - 1) {
      this.selectedImageIndex++;
      this.refreshImageViewer();
    }
  }

  private createDecisionPanel(): void {
    const container = this.add.container(970, 90);
    container.setSize(280, 580);
    container.setName('decision-panel');

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(1, 0xE0E0E0, 1);
    bg.fillRoundedRect(0, 0, 280, 580, 16);
    bg.strokeRoundedRect(0, 0, 280, 580, 16);

    this.add.text(20, 20, '🎯 请选择操作', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    let y = 60;
    const spacing = 75;

    ACTION_OPTIONS.forEach((option, index) => {
      this.createActionButton(20, y, option, index);
      y += spacing;
    });

    container.add([bg]);
  }

  private createActionButton(x: number, y: number, option: typeof ACTION_OPTIONS[0], index: number): void {
    const container = this.add.container(x, y);
    container.setSize(240, 65);
    container.setInteractive({ useHandCursor: true });
    container.setName(`action-btn-${option.type}`);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.lineStyle(2, parseInt(option.color.replace('#', ''), 16), 0.3);
    bg.fillRoundedRect(0, 0, 240, 65, 12);
    bg.strokeRoundedRect(0, 0, 240, 65, 12);

    const colorDot = this.add.graphics();
    colorDot.fillStyle(parseInt(option.color.replace('#', ''), 16), 1);
    colorDot.fillCircle(25, 32, 8);

    this.add.text(45, 22, option.label, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    this.add.text(45, 42, option.description, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '11px',
      color: COLORS.neutral[500],
    });

    container.add([bg, colorDot]);

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.02,
        x: x + 5,
        duration: 150,
        ease: 'Cubic.Out',
      });
      bg.clear();
      bg.fillStyle(parseInt(option.color.replace('#', ''), 16), 0.05);
      bg.lineStyle(3, parseInt(option.color.replace('#', ''), 16), 0.8);
      bg.fillRoundedRect(0, 0, 240, 65, 12);
      bg.strokeRoundedRect(0, 0, 240, 65, 12);
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        x: x,
        duration: 150,
        ease: 'Cubic.Out',
      });
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.lineStyle(2, parseInt(option.color.replace('#', ''), 16), 0.3);
      bg.fillRoundedRect(0, 0, 240, 65, 12);
      bg.strokeRoundedRect(0, 0, 240, 65, 12);
    });

    container.on('pointerdown', () => {
      if (!this.isProcessing) {
        this.handleAction(option.type);
      }
    });

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      delay: index * 100,
      ease: 'Cubic.Out',
    });

    this.actionButtons.push(container);
  }

  private handleAction(action: ActionType): void {
    this.isProcessing = true;

    const state = useGameStore.getState();
    const result = state.processAction(action);

    this.showFeedback(result.isCorrect, result.points, this.currentTask.correctReason);

    if (this.showTutorial) {
      const expectedAction = this.tutorialStep === 6 ? 'archive' : 'follow_up';
      if (action === expectedAction && this.tutorialStep < 8) {
        this.tutorialStep++;
        useGameStore.getState().advanceTutorial();
        this.updateTutorial();
      }
    }

    this.time.delayedCall(1500, () => {
      const currentState = useGameStore.getState();
      if (currentState.gameState && 
          currentState.gameState.currentTaskIndex < currentState.gameState.tasks.length - 1) {
        currentState.nextTask();
        this.scene.restart();
      } else {
        currentState.endGame();
        // 停止所有其他场景，只启动结算场景
        Object.values(SCENE_KEYS).forEach(key => {
          if (key !== SCENE_KEYS.RESULT && this.scene.isActive(key)) {
            this.scene.stop(key);
          }
        });
        this.scene.start(SCENE_KEYS.RESULT);
      }
      this.isProcessing = false;
    });
  }

  private showFeedback(isCorrect: boolean, points: number, message: string): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    const container = this.add.container(centerX, centerY);

    const icon = this.add.text(0, -60, isCorrect ? '✅' : '❌', {
      fontSize: '80px',
    }).setOrigin(0.5);

    const resultText = this.add.text(0, 10, isCorrect ? '回答正确！' : '回答错误', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: isCorrect ? COLORS.success : COLORS.error,
    }).setOrigin(0.5);

    const pointsText = this.add.text(0, 55, 
      points >= 0 ? `+${points} 分` : `${points} 分`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: points >= 0 ? COLORS.success : COLORS.error,
    }).setOrigin(0.5);

    const reasonText = this.add.text(0, 95, message, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: COLORS.neutral[600],
      wordWrap: { width: 400 },
    }).setOrigin(0.5);

    container.add([icon, resultText, pointsText, reasonText]);

    container.setAlpha(0);
    container.setScale(0.5);

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.Out',
    });

    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        scale: 0.8,
        duration: 300,
        ease: 'Cubic.In',
        onComplete: () => {
          overlay.destroy();
          container.destroy();
        },
      });
    });
  }

  private createBackButton(): void {
    const container = this.add.container(80, this.cameras.main.height - 40);
    container.setSize(120, 45);
    container.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.9);
    bg.lineStyle(1, 0xE0E0E0, 1);
    bg.fillRoundedRect(-60, -22, 120, 44, 22);
    bg.strokeRoundedRect(-60, -22, 120, 44, 22);

    this.add.text(-40, 0, '← 退出', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: COLORS.neutral[600],
    }).setOrigin(0, 0.5);

    container.add([bg]);

    container.on('pointerdown', () => {
      useGameStore.getState().resetGame();
      const setCurrentScene = useGameStore.getState().setCurrentScene;
      setCurrentScene(SCENE_KEYS.MAIN_MENU);
      
      // 停止所有其他场景
      Object.values(SCENE_KEYS).forEach(key => {
        if (key !== SCENE_KEYS.MAIN_MENU && this.scene.isActive(key)) {
          this.scene.stop(key);
        }
      });
      
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    });

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        x: 70,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        x: 80,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });
  }

  private createTutorialOverlay(): void {
    this.updateTutorial();
  }

  private updateTutorial(): void {
    const oldOverlay = this.children.getByName('tutorial-overlay');
    if (oldOverlay) {
      oldOverlay.destroy();
    }

    const step = TUTORIAL_STEPS[this.tutorialStep];
    if (!step) {
      this.showTutorial = false;
      useGameStore.getState().setShowTutorial(false);
      return;
    }

    const overlay = this.add.container(0, 0);
    overlay.setName('tutorial-overlay');
    overlay.setDepth(1000);

    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x000000, 0.6);
    dimBg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    let targetX = this.cameras.main.width / 2;
    let targetY = this.cameras.main.height / 2;
    let targetWidth = 300;
    let targetHeight = 200;

    if (step.highlight) {
      const targetElement = this.children.getByName(step.target) as Phaser.GameObjects.Container;
      if (targetElement) {
        const bounds = targetElement.getBounds();
        targetX = bounds.x + bounds.width / 2;
        targetY = bounds.y + bounds.height / 2;
        targetWidth = bounds.width + 20;
        targetHeight = bounds.height + 20;

        const cutout = this.add.graphics();
        cutout.fillStyle(0x000000, 0);
        cutout.fillRoundedRect(
          targetX - targetWidth / 2,
          targetY - targetHeight / 2,
          targetWidth,
          targetHeight,
          16
        );

        this.tweens.add({
          targets: cutout,
          scale: { from: 0.95, to: 1.05 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });

        overlay.add([cutout]);
      }
    }

    let tooltipX = targetX;
    let tooltipY = targetY - targetHeight / 2 - 80;

    if (step.position === 'bottom') {
      tooltipY = targetY + targetHeight / 2 + 80;
    } else if (step.position === 'left') {
      tooltipX = targetX - targetWidth / 2 - 180;
      tooltipY = targetY;
    } else if (step.position === 'right') {
      tooltipX = targetX + targetWidth / 2 + 180;
      tooltipY = targetY;
    }

    const tooltip = this.add.container(tooltipX, tooltipY);

    const tooltipBg = this.add.graphics();
    tooltipBg.fillStyle(0xffffff, 1);
    tooltipBg.lineStyle(3, parseInt(COLORS.primary.replace('#', ''), 16), 1);
    tooltipBg.fillRoundedRect(-170, -60, 340, 120, 16);
    tooltipBg.strokeRoundedRect(-170, -60, 340, 120, 16);

    this.add.text(0, -35, step.title, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.primary,
    }).setOrigin(0.5);

    this.add.text(0, 0, step.content, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[700],
      wordWrap: { width: 300 },
      align: 'center',
    }).setOrigin(0.5);

    const nextBtn = this.add.container(0, 40);
    nextBtn.setSize(100, 35);
    nextBtn.setInteractive({ useHandCursor: true });

    const btnBg = this.add.graphics();
    btnBg.fillStyle(parseInt(COLORS.primary.replace('#', ''), 16), 1);
    btnBg.fillRoundedRect(-50, -17, 100, 35, 17);

    this.add.text(0, 0, this.tutorialStep < TUTORIAL_STEPS.length - 1 ? '下一步 →' : '开始游戏', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    nextBtn.add([btnBg]);

    nextBtn.on('pointerdown', () => {
      if (this.tutorialStep < TUTORIAL_STEPS.length - 1) {
        this.tutorialStep++;
        useGameStore.getState().advanceTutorial();
        this.updateTutorial();
      } else {
        this.showTutorial = false;
        useGameStore.getState().setShowTutorial(false);
        oldOverlay?.destroy();
      }
    });

    tooltip.add([tooltipBg, nextBtn]);
    overlay.add([dimBg, tooltip]);

    tooltip.setAlpha(0);
    tooltip.setScale(0.8);
    this.tweens.add({
      targets: tooltip,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.Out',
    });
  }
}
