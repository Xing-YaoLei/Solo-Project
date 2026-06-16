import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { COLORS } from '../config/colors';
import { useGameStore } from '../stores/gameStore';
import { ACTION_LABELS, ERROR_CATEGORIES } from '../data/actions';
import { formatTime } from '../utils/scoring';
import type { GameResult, GameError } from '../types/game';

export class ResultScene extends Phaser.Scene {
  private gameResult!: GameResult;
  private levelName = '';
  private errorListContainer!: Phaser.GameObjects.Container;
  private showMoreErrors = false;

  constructor() {
    super(SCENE_KEYS.RESULT);
  }

  create(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.RESULT);

    const state = useGameStore.getState();
    if (!state.gameResult) {
      this.scene.start(SCENE_KEYS.MAIN_MENU);
      return;
    }

    this.gameResult = state.gameResult;
    this.levelName = state.currentLevel?.name || '游戏';

    this.createBackground();
    this.createResultHeader();
    this.createScoreCard();
    this.createStatsGrid();
    this.createErrorAnalysis();
    this.createActionButtons();
  }

  private createBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      0xE8F5E9,
      0xF3E5F5,
      0xE8F5E9,
      0xF3E5F5
    );
    gradient.fillRect(0, 0, width, height);

    const decorCircle1 = this.add.circle(width * 0.1, height * 0.15, 100, 0x81C784, 0.1);
    const decorCircle2 = this.add.circle(width * 0.9, height * 0.85, 120, 0xBA68C8, 0.1);
    const decorCircle3 = this.add.circle(width * 0.15, height * 0.9, 80, 0x64B5F6, 0.1);

    this.tweens.add({
      targets: [decorCircle1, decorCircle2, decorCircle3],
      scale: { from: 1, to: 1.15 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createResultHeader(): void {
    const width = this.cameras.main.width;
    const centerY = 100;

    const passed = this.gameResult.passed;
    const titleText = passed ? '🎉 恭喜通关！' : '💪 继续努力！';
    const subtitleText = passed 
      ? '您已成功完成本关卡的培训' 
      : `未达到及格分数 ${useGameStore.getState().currentLevel?.passingScore || 0} 分`;

    const title = this.add.text(width / 2, centerY, titleText, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: passed ? COLORS.success : COLORS.warning,
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, centerY + 50, `${this.levelName} - ${subtitleText}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      color: COLORS.neutral[600],
    }).setOrigin(0.5);

    this.createStarsDisplay(width / 2, centerY + 110);

    title.setAlpha(0);
    title.setScale(0.5);
    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.Out',
    });

    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 300,
      ease: 'Cubic.Out',
    });
  }

  private createStarsDisplay(x: number, y: number): void {
    const stars = this.gameResult.stars;
    const starSpacing = 70;
    const startX = x - starSpacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * starSpacing;
      const filled = i < stars;
      
      const star = this.add.text(starX, y, filled ? '⭐' : '☆', {
        fontSize: '56px',
        color: filled ? undefined : COLORS.neutral[300],
      }).setOrigin(0.5);

      star.setAlpha(0);
      star.setScale(0);

      this.tweens.add({
        targets: star,
        alpha: 1,
        scale: 1,
        duration: 400,
        delay: 600 + i * 200,
        ease: 'Back.Out',
      });

      if (filled) {
        this.tweens.add({
          targets: star,
          scale: { from: 1, to: 1.2 },
          duration: 800,
          delay: 1200 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    }
  }

  private createScoreCard(): void {
    const width = this.cameras.main.width;
    const centerY = 290;

    const container = this.add.container(width / 2, centerY);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(2, parseInt(COLORS.primary.replace('#', ''), 16), 0.2);
    bg.fillRoundedRect(-200, -80, 400, 160, 20);
    bg.strokeRoundedRect(-200, -80, 400, 160, 20);

    this.add.text(0, -45, '最终得分', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      color: COLORS.neutral[500],
    }).setOrigin(0.5);

    const scoreText = this.add.text(0, 10, this.gameResult.score.toString(), {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '56px',
      fontStyle: 'bold',
      color: COLORS.primary,
    }).setOrigin(0.5);

    this.add.text(0, 55, `/ ${this.gameResult.maxScore} 满分`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: COLORS.neutral[400],
    }).setOrigin(0.5);

    container.add([bg, scoreText]);

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: centerY,
      duration: 600,
      delay: 800,
      ease: 'Back.Out',
    });
  }

  private createStatsGrid(): void {
    const width = this.cameras.main.width;
    const startY = 420;
    const statWidth = 180;
    const spacing = 30;
    const totalWidth = statWidth * 4 + spacing * 3;
    const startX = (width - totalWidth) / 2 + statWidth / 2;

    const stats = [
      { label: '总用时', value: formatTime(this.gameResult.totalTime), icon: '⏱️', color: COLORS.primary },
      { label: '正确率', value: `${this.gameResult.accuracy}%`, icon: '🎯', color: COLORS.success },
      { label: '平均响应', value: `${this.gameResult.avgResponseTime}s`, icon: '⚡', color: COLORS.warning },
      { label: '最大连击', value: `${this.gameResult.maxCombo}🔥`, icon: '🔥', color: '#E91E63' },
    ];

    stats.forEach((stat, index) => {
      const x = startX + index * (statWidth + spacing);
      this.createStatCard(x, startY, stat, index);
    });
  }

  private createStatCard(x: number, y: number, stat: { label: string; value: string; icon: string; color: string }, index: number): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(1, 0xE0E0E0, 1);
    bg.fillRoundedRect(-90, -50, 180, 100, 16);
    bg.strokeRoundedRect(-90, -50, 180, 100, 16);

    this.add.text(-60, -15, stat.icon, {
      fontSize: '28px',
    }).setOrigin(0, 0.5);

    this.add.text(-10, -18, stat.value, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: stat.color,
    }).setOrigin(0, 0.5);

    this.add.text(-10, 15, stat.label, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[500],
    }).setOrigin(0, 0.5);

    container.add([bg]);

    container.setAlpha(0);
    container.setY(y + 30);
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 500,
      delay: 1000 + index * 150,
      ease: 'Back.Out',
    });
  }

  private createErrorAnalysis(): void {
    const width = this.cameras.main.width;
    const startY = 560;

    const container = this.add.container(width / 2, startY);
    this.errorListContainer = container;

    const hasErrors = this.gameResult.errors.length > 0;

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(1, hasErrors ? parseInt(COLORS.error.replace('#', ''), 16) : 0xE0E0E0, 0.3);
    bg.fillRoundedRect(-500, -10, 1000, hasErrors ? 220 : 80, 16);
    bg.strokeRoundedRect(-500, -10, 1000, hasErrors ? 220 : 80, 16);

    const title = this.add.text(-470, 20, hasErrors ? '❌ 错因分析' : '✅ 完美表现！', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: hasErrors ? COLORS.error : COLORS.success,
    }).setOrigin(0, 0.5);

    container.add([bg, title]);

    if (hasErrors) {
      this.add.text(-470, 50, `共 ${this.gameResult.errors.length} 处错误，点击展开查看详情`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '14px',
        color: COLORS.neutral[500],
      }).setOrigin(0, 0.5);

      this.createErrorSummary(container);
      this.createErrorList(container);
    } else {
      this.add.text(-470, 50, '太棒了！您没有犯任何错误，继续保持！', {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '16px',
        color: COLORS.neutral[600],
      }).setOrigin(0, 0.5);
    }

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 600,
      delay: 1400,
      ease: 'Cubic.Out',
    });
  }

  private createErrorSummary(parent: Phaser.GameObjects.Container): void {
    const errorCategories = new Map<string, number>();
    
    this.gameResult.errors.forEach(error => {
      const category = this.getErrorCategoryCode(error);
      const count = errorCategories.get(category) || 0;
      errorCategories.set(category, count + 1);
    });

    const categoryArray = Array.from(errorCategories.entries()).slice(0, 4);
    const startX = -470;
    const y = 90;
    const spacing = 15;

    let currentX = startX;

    categoryArray.forEach(([code, count]) => {
      const category = ERROR_CATEGORIES[code.toUpperCase()] || { label: code, description: '' };
      
      const tagContainer = this.add.container(currentX, y, parent);
      
      const tagBg = this.add.graphics();
      tagBg.fillStyle(parseInt(COLORS.error.replace('#', ''), 16), 0.1);
      tagBg.lineStyle(1, parseInt(COLORS.error.replace('#', ''), 16), 0.3);
      tagBg.fillRoundedRect(0, -18, 160, 36, 18);
      tagBg.strokeRoundedRect(0, -18, 160, 36, 18);

      this.add.text(15, 0, category.label, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: COLORS.error,
      }).setOrigin(0, 0.5);

      this.add.text(145, 0, `×${count}`, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: COLORS.error,
      }).setOrigin(1, 0.5);

      tagContainer.add([tagBg]);
      currentX += 160 + spacing;
    });
  }

  private createErrorList(parent: Phaser.GameObjects.Container): void {
    const toggleBtn = this.add.container(430, 20, parent);
    toggleBtn.setSize(120, 40);
    toggleBtn.setInteractive({ useHandCursor: true });

    const toggleBg = this.add.graphics();
    toggleBg.fillStyle(parseInt(COLORS.primary.replace('#', ''), 16), 0.1);
    toggleBg.lineStyle(1, parseInt(COLORS.primary.replace('#', ''), 16), 0.3);
    toggleBg.fillRoundedRect(-60, -20, 120, 40, 20);
    toggleBg.strokeRoundedRect(-60, -20, 120, 40, 20);

    const toggleText = this.add.text(0, 0, '查看详情 ▼', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: COLORS.primary,
    }).setOrigin(0.5);

    toggleBtn.add([toggleBg, toggleText]);

    const errorListBg = this.add.graphics();
    parent.add(errorListBg);
    const errorListContent = this.add.container(0, 130);
    parent.add(errorListContent);
    errorListContent.setName('error-list-content');
    errorListContent.setVisible(false);

    toggleBtn.on('pointerdown', () => {
      this.showMoreErrors = !this.showMoreErrors;
      toggleText.setText(this.showMoreErrors ? '收起详情 ▲' : '查看详情 ▼');
      errorListContent.setVisible(this.showMoreErrors);
      
      const mainBg = parent.getAt(0) as Phaser.GameObjects.Graphics;
      if (mainBg) {
        mainBg.clear();
        const newHeight = this.showMoreErrors ? 420 : 220;
        mainBg.fillStyle(0xffffff, 0.95);
        mainBg.lineStyle(1, parseInt(COLORS.error.replace('#', ''), 16), 0.3);
        mainBg.fillRoundedRect(-500, -10, 1000, newHeight, 16);
        mainBg.strokeRoundedRect(-500, -10, 1000, newHeight, 16);
      }

      if (this.showMoreErrors && errorListContent.length === 0) {
        this.populateErrorList(errorListContent);
      }
    });
  }

  private populateErrorList(parent: Phaser.GameObjects.Container): void {
    const errors = this.gameResult.errors;
    let y = 0;
    const spacing = 15;

    errors.forEach((error, index) => {
      const errorCard = this.createErrorCard(error, index, y);
      parent.add(errorCard);
      y += 90 + spacing;
    });

    parent.setAlpha(0);
    this.tweens.add({
      targets: parent,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.Out',
    });
  }

  private createErrorCard(error: GameError, index: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xFFEBEE, 1);
    bg.lineStyle(1, parseInt(COLORS.error.replace('#', ''), 16), 0.2);
    bg.fillRoundedRect(-470, 0, 940, 90, 12);
    bg.strokeRoundedRect(-470, 0, 940, 90, 12);

    this.add.text(-450, 20, `#${index + 1} ${error.patientName}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    }).setOrigin(0, 0.5);

    const categoryCode = this.getErrorCategoryCode(error);
    const category = ERROR_CATEGORIES[categoryCode.toUpperCase()] || { label: '其他错误', description: '' };

    this.add.text(-450, 45, `⚠️ ${category.label}: ${category.description}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: COLORS.error,
    }).setOrigin(0, 0.5);

    this.add.text(-450, 68, 
      `您选择: ${ACTION_LABELS[error.selectedAction] || error.selectedAction} → 正确答案: ${ACTION_LABELS[error.correctAction] || error.correctAction}`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '12px',
      color: COLORS.neutral[600],
    }).setOrigin(0, 0.5);

    this.add.text(450, 20, `${error.responseTime.toFixed(1)}s`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '12px',
      color: COLORS.neutral[500],
    }).setOrigin(1, 0.5);

    container.add([bg]);
    return container;
  }

  private getErrorCategoryCode(error: GameError): string {
    const selected = error.selectedAction;
    const correct = error.correctAction;

    if (selected === 'archive' && correct !== 'archive') return 'wrong_archive';
    if (selected !== 'follow_up' && correct === 'follow_up') return 'missed_followup';
    if ((selected === 'forward_doctor' && correct === 'forward_front') ||
        (selected === 'forward_front' && correct === 'forward_doctor')) return 'wrong_forward';
    if ((selected === 'return_missing' || selected === 'return_quality') && !correct.startsWith('return_')) return 'unnecessary_return';
    if (selected !== 'missed_appointment' && correct === 'missed_appointment') return 'missed_missed_appointment';
    if (selected !== 'return_quality' && correct === 'return_quality') return 'quality_issue';
    if (selected !== 'return_missing' && correct === 'return_missing') return 'missing_documents';
    return 'other';
  }

  private createActionButtons(): void {
    const width = this.cameras.main.width;
    const y = this.cameras.main.height - 60;
    const buttonWidth = 180;
    const spacing = 30;
    const totalWidth = buttonWidth * 3 + spacing * 2;
    const startX = (width - totalWidth) / 2 + buttonWidth / 2;

    const buttons = [
      { 
        label: '🏠 主菜单', 
        color: COLORS.neutral[600], 
        action: () => this.goToMainMenu() 
      },
      { 
        label: '📋 关卡选择', 
        color: COLORS.primary, 
        action: () => this.goToLevelSelect() 
      },
      { 
        label: '🔄 重新挑战', 
        color: COLORS.success, 
        action: () => this.retryLevel() 
      },
    ];

    buttons.forEach((btn, index) => {
      const x = startX + index * (buttonWidth + spacing);
      this.createActionButton(x, y, btn.label, btn.color, btn.action, index);
    });
  }

  private createActionButton(
    x: number, 
    y: number, 
    label: string, 
    color: string, 
    action: () => void, 
    index: number
  ): void {
    const container = this.add.container(x, y);
    container.setSize(180, 50);
    container.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(parseInt(color.replace('#', ''), 16), 1);
    bg.fillRoundedRect(-90, -25, 180, 50, 25);

    this.add.text(0, 0, label, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg]);

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 100,
        ease: 'Cubic.Out',
        yoyo: true,
        onComplete: () => action(),
      });
    });

    container.setAlpha(0);
    container.setY(y + 20);
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 500,
      delay: 1600 + index * 150,
      ease: 'Back.Out',
    });
  }

  private goToMainMenu(): void {
    useGameStore.getState().resetGame();
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.MAIN_MENU);
    
    Object.values(SCENE_KEYS).forEach(key => {
      if (key !== SCENE_KEYS.MAIN_MENU && this.scene.isActive(key)) {
        this.scene.stop(key);
      }
    });
    
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }

  private goToLevelSelect(): void {
    useGameStore.getState().resetGame();
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.LEVEL_SELECT);
    
    Object.values(SCENE_KEYS).forEach(key => {
      if (key !== SCENE_KEYS.LEVEL_SELECT && this.scene.isActive(key)) {
        this.scene.stop(key);
      }
    });
    
    this.scene.start(SCENE_KEYS.LEVEL_SELECT);
  }

  private retryLevel(): void {
    const state = useGameStore.getState();
    const level = state.currentLevel;
    
    if (level) {
      state.resetGame();
      state.startGame(level);
      const setCurrentScene = state.setCurrentScene;
      setCurrentScene(SCENE_KEYS.GAME);
      
      Object.values(SCENE_KEYS).forEach(key => {
        if (key !== SCENE_KEYS.GAME && this.scene.isActive(key)) {
          this.scene.stop(key);
        }
      });
      
      this.scene.start(SCENE_KEYS.GAME);
    } else {
      this.goToLevelSelect();
    }
  }

  update(): void {
    //
  }
}
