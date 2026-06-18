import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES, DIFFICULTY_CONFIG } from './styles';
import type { Task, Difficulty } from '../models';

export interface TaskCardConfig {
  width?: number;
  height?: number;
  onClick?: (task: Task) => void;
}

export class TaskCard extends BaseComponent<TaskCard> {
  private task: Task;
  private config: Required<TaskCardConfig>;
  private background!: Phaser.GameObjects.Graphics;
  private border!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private clientText!: Phaser.GameObjects.Text;
  private budgetText!: Phaser.GameObjects.Text;
  private durationText!: Phaser.GameObjects.Text;
  private rewardText!: Phaser.GameObjects.Text;
  private difficultyStars: Phaser.GameObjects.Text[] = [];
  private difficultyLabel!: Phaser.GameObjects.Text;
  private houseInfoText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, task: Task, config: TaskCardConfig = {}) {
    super(scene);
    this.task = task;
    this.config = {
      width: 320,
      height: 200,
      onClick: () => {},
      ...config,
    };
    this.initialize();
  }

  protected initialize(): void {
    const { width, height } = this.config;
    this.setSize(width, height);

    this.createBackground();
    this.createBorder();
    this.createTitle();
    this.createDifficultyStars();
    this.createClientInfo();
    this.createHouseInfo();
    this.createStats();
    this.setupInteraction();
  }

  private createBackground(): void {
    const { width, height } = this.config;
    this.background = this.scene.add.graphics();
    this.background.fillStyle(UI_STYLES.colors.background, 1);
    this.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    this.add(this.background);
  }

  private createBorder(): void {
    const { width, height } = this.config;
    this.border = this.scene.add.graphics();
    this.border.lineStyle(2, UI_STYLES.colors.border, 1);
    this.border.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    this.add(this.border);
  }

  private createTitle(): void {
    this.titleText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      UI_STYLES.spacing.lg,
      this.task.title,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0, 0);
    this.add(this.titleText);
  }

  private createDifficultyStars(): void {
    const diffConfig = DIFFICULTY_CONFIG[this.task.difficulty as Difficulty];
    const startX = UI_STYLES.spacing.lg;
    const startY = UI_STYLES.spacing.lg + 32;

    for (let i = 0; i < 5; i++) {
      const star = this.scene.add.text(
        startX + i * 24,
        startY,
        i < diffConfig.stars ? '★' : '☆',
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: '20px',
          color: `#${diffConfig.color.toString(16).padStart(6, '0')}`,
        }
      );
      star.setOrigin(0, 0);
      this.difficultyStars.push(star);
      this.add(star);
    }

    this.difficultyLabel = this.scene.add.text(
      startX + 140,
      startY,
      diffConfig.label,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${diffConfig.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.difficultyLabel.setOrigin(0, 0);
    this.add(this.difficultyLabel);
  }

  private createClientInfo(): void {
    const startY = UI_STYLES.spacing.lg + 64;
    this.clientText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      startY,
      `客户: ${this.task.clientName}`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
      }
    );
    this.clientText.setOrigin(0, 0);
    this.add(this.clientText);
  }

  private createHouseInfo(): void {
    const startY = UI_STYLES.spacing.lg + 88;
    this.houseInfoText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      startY,
      `${this.task.houseType} · ${this.task.area}㎡`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
      }
    );
    this.houseInfoText.setOrigin(0, 0);
    this.add(this.houseInfoText);
  }

  private createStats(): void {
    const { width } = this.config;
    const startY = this.config.height - UI_STYLES.spacing.xl - 20;
    const statWidth = (width - UI_STYLES.spacing.lg * 2) / 3;

    this.budgetText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      startY,
      `预算\n¥${this.task.budget.toLocaleString()}`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        align: 'center',
      }
    );
    this.budgetText.setOrigin(0, 0);
    this.add(this.budgetText);

    this.durationText = this.scene.add.text(
      UI_STYLES.spacing.lg + statWidth,
      startY,
      `工期\n${this.task.duration}天`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        align: 'center',
      }
    );
    this.durationText.setOrigin(0, 0);
    this.add(this.durationText);

    this.rewardText = this.scene.add.text(
      UI_STYLES.spacing.lg + statWidth * 2,
      startY,
      `奖励\n¥${this.task.reward.toLocaleString()}`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.success.toString(16).padStart(6, '0')}`,
        align: 'center',
      }
    );
    this.rewardText.setOrigin(0, 0);
    this.add(this.rewardText);
  }

  private setupInteraction(): void {
    const { width, height } = this.config;
    this.setInteractive(true);
    if (this.input) {
      this.input.hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    }

    this.on('pointerover', () => {
      if (this.isDisabled) return;
      this.setHover(true);
      this.scene.input.setDefaultCursor('pointer');
    });

    this.on('pointerout', () => {
      this.setHover(false);
      this.scene.input.setDefaultCursor('default');
    });

    this.on('pointerdown', () => {
      if (this.isDisabled) return;
      this.setSelected(true);
      this.config.onClick(this.task);
    });
  }

  protected onHoverChange(hovered: boolean): void {
    const targetScale = hovered ? 1.03 : 1;
    const targetY = hovered ? -4 : 0;

    this.scene.tweens.add({
      targets: this,
      scale: targetScale,
      y: this.y + targetY - (hovered ? 0 : -4),
      duration: UI_STYLES.animation.duration.fast,
      ease: UI_STYLES.animation.ease,
    });

    this.updateBorderStyle();
  }

  protected onSelectChange(_selected: boolean): void {
    this.updateBorderStyle();
  }

  protected onDisableChange(disabled: boolean): void {
    this.setAlpha(disabled ? 0.5 : 1);
    this.updateBorderStyle();
  }

  private updateBorderStyle(): void {
    const { width, height } = this.config;
    this.border.clear();

    let borderColor = UI_STYLES.colors.border;
    let lineWidth = 2;

    if (this.isSelected) {
      borderColor = UI_STYLES.colors.primary;
      lineWidth = 3;
    } else if (this.isHovered && !this.isDisabled) {
      borderColor = UI_STYLES.colors.secondary;
      lineWidth = 2;
    }

    if (this.isSelected) {
      this.background.clear();
      this.background.fillStyle(UI_STYLES.colors.primary, 0.05);
      this.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    } else {
      this.background.clear();
      this.background.fillStyle(UI_STYLES.colors.background, 1);
      this.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    }

    this.border.lineStyle(lineWidth, borderColor, 1);
    this.border.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
  }

  public setTask(task: Task): TaskCard {
    this.task = task;
    this.removeAll(true);
    this.difficultyStars = [];
    this.initialize();
    return this;
  }

  public getTask(): Task {
    return this.task;
  }

  public onClick(callback: (task: Task) => void): TaskCard {
    this.config.onClick = callback;
    return this;
  }
}
