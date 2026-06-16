import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { COLORS, CATEGORY_COLORS, MODE_COLORS, DIFFICULTY_COLORS } from '../config/colors';
import { useGameStore } from '../stores/gameStore';
import { LEVELS } from '../data/levels';
import type { Level, GameMode, LevelCategory } from '../types/game';
import { getLevelProgress } from '../utils/storage';

export class LevelSelectScene extends Phaser.Scene {
  private currentCategory: LevelCategory | 'all' = 'all';
  private currentMode: GameMode | 'all' = 'all';
  private levelCards: Phaser.GameObjects.Container[] = [];
  private backButton!: Phaser.GameObjects.Container;

  constructor() {
    super(SCENE_KEYS.LEVEL_SELECT);
  }

  create(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.LEVEL_SELECT);

    this.createBackground();
    this.createHeader();
    this.createFilters();
    this.createLevelGrid();
    this.createBackButton();
  }

  private createBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      0xF5F7FA,
      0xE3F2FD,
      0xF5F7FA,
      0xE3F2FD
    );
    gradient.fillRect(0, 0, width, height);
  }

  private createHeader(): void {
    const width = this.cameras.main.width;

    this.add.rectangle(width / 2, 50, width, 100, 0xffffff, 0.9);

    const title = this.add.text(width / 2, 50, '📋 选择关卡', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: { from: 0, to: 1 },
      y: { from: 30, to: 50 },
      duration: 500,
      ease: 'Cubic.Out',
    });

    const progress = this.calculateProgress();
    this.add.text(width / 2, 85, `进度: ${progress.completed}/${progress.total} 关卡 | ${progress.stars}⭐`, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: COLORS.neutral[600],
    }).setOrigin(0.5);
  }

  private createFilters(): void {
    const startY = 130;

    const categories: { label: string; value: LevelCategory | 'all'; icon: string }[] = [
      { label: '全部', value: 'all', icon: '📁' },
      { label: '影像归档', value: 'archive', icon: '📷' },
      { label: '前台', value: 'frontdesk', icon: '🏢' },
      { label: '护士', value: 'nurse', icon: '💉' },
    ];

    const modes: { label: string; value: GameMode | 'all'; icon: string }[] = [
      { label: '全部模式', value: 'all', icon: '🎯' },
      { label: '训练关卡', value: 'training', icon: '📚' },
      { label: '自由练习', value: 'practice', icon: '🎮' },
      { label: '高难挑战', value: 'challenge', icon: '🔥' },
    ];

    categories.forEach((cat, index) => {
      this.createFilterButton(
        150 + index * 180,
        startY,
        cat.icon,
        cat.label,
        () => {
          this.currentCategory = cat.value;
          this.refreshLevelGrid();
        },
        cat.value === 'all' ? COLORS.neutral[600] : CATEGORY_COLORS[cat.value],
        cat.value === this.currentCategory
      );
    });

    modes.forEach((mode, index) => {
      this.createFilterButton(
        150 + index * 180,
        startY + 60,
        mode.icon,
        mode.label,
        () => {
          this.currentMode = mode.value;
          this.refreshLevelGrid();
        },
        mode.value === 'all' ? COLORS.neutral[600] : MODE_COLORS[mode.value],
        mode.value === this.currentMode
      );
    });
  }

  private createFilterButton(
    x: number,
    y: number,
    icon: string,
    label: string,
    onClick: () => void,
    color: string,
    active: boolean
  ): void {
    const container = this.add.container(x, y);
    container.setSize(160, 45);
    container.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    if (active) {
      bg.fillStyle(parseInt(color.replace('#', ''), 16), 0.9);
    } else {
      bg.fillStyle(0xffffff, 0.8);
      bg.lineStyle(1, 0xE0E0E0, 1);
    }
    bg.fillRoundedRect(-80, -22, 160, 44, 22);
    if (!active) {
      bg.strokeRoundedRect(-80, -22, 160, 44, 22);
    }

    const iconText = this.add.text(-60, 0, icon, {
      fontSize: '20px',
    }).setOrigin(0, 0.5);

    const labelText = this.add.text(-30, 0, label, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '15px',
      color: active ? '#ffffff' : COLORS.neutral[700],
      fontStyle: active ? 'bold' : 'normal',
    }).setOrigin(0, 0.5);

    container.add([bg, iconText, labelText]);

    container.on('pointerdown', () => {
      onClick();
    });

    container.on('pointerover', () => {
      if (!active) {
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 150,
          ease: 'Cubic.Out',
        });
      }
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });
  }

  private createLevelGrid(): void {
    const filteredLevels = this.getFilteredLevels();
    const startX = 150;
    const startY = 250;
    const cardWidth = 350;
    const cardHeight = 180;
    const cols = 3;
    const spacingX = 50;
    const spacingY = 30;

    filteredLevels.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + spacingX);
      const y = startY + row * (cardHeight + spacingY);

      this.createLevelCard(x, y, level, index);
    });

    if (filteredLevels.length === 0) {
      this.add.text(this.cameras.main.width / 2, 400, '暂无符合条件的关卡', {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '24px',
        color: COLORS.neutral[500],
      }).setOrigin(0.5);
    }
  }

  private createLevelCard(x: number, y: number, level: Level, index: number): void {
    const container = this.add.container(x, y);
    container.setSize(350, 180);

    const savedProgress = getLevelProgress()[level.id];
    const unlocked = level.unlocked || savedProgress?.completed;
    const stars = savedProgress?.stars || level.stars;
    const bestScore = savedProgress?.bestScore || level.bestScore;

    if (!unlocked) {
      container.setAlpha(0.6);
    } else {
      container.setInteractive({ useHandCursor: true });
    }

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(2, parseInt(CATEGORY_COLORS[level.category].replace('#', ''), 16), 0.3);
    bg.fillRoundedRect(0, 0, 350, 180, 16);
    bg.strokeRoundedRect(0, 0, 350, 180, 16);

    const categoryColor = CATEGORY_COLORS[level.category];
    const modeColor = MODE_COLORS[level.mode];
    const difficultyColor = DIFFICULTY_COLORS[level.difficulty];

    const categoryBadge = this.add.graphics();
    categoryBadge.fillStyle(parseInt(categoryColor.replace('#', ''), 16), 0.9);
    categoryBadge.fillRoundedRect(15, 15, 90, 28, 14);

    const categoryText = this.add.text(60, 29, this.getCategoryLabel(level.category), {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const modeBadge = this.add.graphics();
    modeBadge.fillStyle(parseInt(modeColor.replace('#', ''), 16), 0.9);
    modeBadge.fillRoundedRect(115, 15, 90, 28, 14);

    const modeText = this.add.text(160, 29, this.getModeLabel(level.mode), {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const difficultyBadge = this.add.graphics();
    difficultyBadge.fillStyle(parseInt(difficultyColor.replace('#', ''), 16), 0.9);
    difficultyBadge.fillRoundedRect(215, 15, 80, 28, 14);

    const difficultyText = this.add.text(255, 29, this.getDifficultyLabel(level.difficulty), {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (!unlocked) {
      this.add.text(175, 55, '🔒', {
        fontSize: '32px',
      }).setOrigin(0.5);
    }

    const nameText = this.add.text(20, unlocked ? 60 : 100, level.name, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    });

    const descText = this.add.text(20, unlocked ? 90 : 130, level.description, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[500],
      wordWrap: { width: 310 },
    });

    if (unlocked) {
      this.add.text(20, 145, '⭐'.repeat(stars) + '☆'.repeat(3 - stars), {
        fontSize: '20px',
      });

      if (bestScore > 0) {
        this.add.text(200, 148, `最佳: ${bestScore}分`, {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: '14px',
          color: COLORS.success,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5);
      }

      if (level.passingScore > 0) {
        this.add.text(300, 148, `及格: ${level.passingScore}`, {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: '13px',
          color: COLORS.neutral[500],
        }).setOrigin(1, 0.5);
      }

      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.03,
          y: y - 5,
          duration: 200,
          ease: 'Cubic.Out',
        });
        bg.clear();
        bg.fillStyle(0xffffff, 1);
        bg.lineStyle(3, parseInt(categoryColor.replace('#', ''), 16), 0.8);
        bg.fillRoundedRect(0, 0, 350, 180, 16);
        bg.strokeRoundedRect(0, 0, 350, 180, 16);
      });

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          y: y,
          duration: 200,
          ease: 'Cubic.Out',
        });
        bg.clear();
        bg.fillStyle(0xffffff, 0.95);
        bg.lineStyle(2, parseInt(categoryColor.replace('#', ''), 16), 0.3);
        bg.fillRoundedRect(0, 0, 350, 180, 16);
        bg.strokeRoundedRect(0, 0, 350, 180, 16);
      });

      container.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scale: 0.98,
          duration: 100,
          ease: 'Cubic.Out',
          yoyo: true,
          onComplete: () => {
            this.startLevel(level);
          },
        });
      });
    }

    container.add([bg, categoryBadge, modeBadge, difficultyBadge, categoryText, modeText, difficultyText, nameText, descText]);

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 400,
      delay: index * 100,
      ease: 'Cubic.Out',
    });

    this.levelCards.push(container);
  }

  private refreshLevelGrid(): void {
    this.levelCards.forEach(card => {
      this.tweens.add({
        targets: card,
        alpha: 0,
        scale: 0.9,
        duration: 200,
        ease: 'Cubic.In',
        onComplete: () => {
          card.destroy();
        },
      });
    });
    this.levelCards = [];

    this.time.delayedCall(250, () => {
      this.createLevelGrid();
    });
  }

  private createBackButton(): void {
    this.backButton = this.add.container(80, 50);
    this.backButton.setSize(100, 50);
    this.backButton.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.9);
    bg.lineStyle(1, 0xE0E0E0, 1);
    bg.fillRoundedRect(-50, -25, 100, 50, 25);
    bg.strokeRoundedRect(-50, -25, 100, 50, 25);

    const arrow = this.add.text(-30, 0, '←', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      color: COLORS.neutral[700],
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const text = this.add.text(0, 0, '返回', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: COLORS.neutral[700],
    }).setOrigin(0, 0.5);

    this.backButton.add([bg, arrow, text]);

    this.backButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.backButton,
        x: 70,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });

    this.backButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.backButton,
        x: 80,
        duration: 150,
        ease: 'Cubic.Out',
      });
    });

    this.backButton.on('pointerdown', () => {
      this.goBack();
    });
  }

  private getFilteredLevels(): Level[] {
    let levels = [...LEVELS];

    if (this.currentCategory !== 'all') {
      levels = levels.filter(l => l.category === this.currentCategory);
    }

    if (this.currentMode !== 'all') {
      levels = levels.filter(l => l.mode === this.currentMode);
    }

    return levels;
  }

  private getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      archive: '影像归档',
      frontdesk: '前台',
      nurse: '护士',
    };
    return labels[category] || category;
  }

  private getModeLabel(mode: string): string {
    const labels: Record<string, string> = {
      training: '训练',
      practice: '练习',
      challenge: '挑战',
    };
    return labels[mode] || mode;
  }

  private getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return labels[difficulty] || difficulty;
  }

  private calculateProgress(): { completed: number; total: number; stars: number } {
    const savedProgress = getLevelProgress();
    const trainingLevels = LEVELS.filter(l => l.mode === 'training');
    let completed = 0;
    let stars = 0;

    trainingLevels.forEach(level => {
      const progress = savedProgress[level.id];
      if (progress?.completed) {
        completed++;
        stars += progress.stars;
      }
    });

    return {
      completed,
      total: trainingLevels.length,
      stars,
    };
  }

  private startLevel(level: Level): void {
    const startGame = useGameStore.getState().startGame;
    startGame(level, false);

    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.GAME);

    // 停止所有其他场景，只启动游戏场景
    Object.values(SCENE_KEYS).forEach(key => {
      if (key !== SCENE_KEYS.GAME && this.scene.isActive(key)) {
        this.scene.stop(key);
      }
    });
    
    this.scene.start(SCENE_KEYS.GAME);
  }

  private goBack(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.MAIN_MENU);
    
    // 停止所有其他场景
    Object.values(SCENE_KEYS).forEach(key => {
      if (key !== SCENE_KEYS.MAIN_MENU && this.scene.isActive(key)) {
        this.scene.stop(key);
      }
    });
    
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }
}
