import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES, PHASE_CONFIG } from './styles';
import type { ConstructionPhase } from '../models';

export interface ProgressBarConfig {
  width?: number;
  totalBudget?: number;
  totalDuration?: number;
}

export class ProgressBar extends BaseComponent<ProgressBar> {
  private config: Required<ProgressBarConfig>;
  private currentPhase: ConstructionPhase = 'preparation';
  private score: number = 0;
  private remainingBudget: number = 0;
  private remainingDuration: number = 0;
  private phaseProgress: number = 0;
  private background!: Phaser.GameObjects.Graphics;
  private phaseBarContainer!: Phaser.GameObjects.Container;
  private phaseBarBg!: Phaser.GameObjects.Graphics;
  private phaseBarFill!: Phaser.GameObjects.Graphics;
  private phaseLabel!: Phaser.GameObjects.Text;
  private phaseProgressText!: Phaser.GameObjects.Text;
  private statsContainer!: Phaser.GameObjects.Container;
  private scoreStat!: Phaser.GameObjects.Container;
  private budgetStat!: Phaser.GameObjects.Container;
  private durationStat!: Phaser.GameObjects.Container;

  private phases: ConstructionPhase[] = [
    'preparation',
    'demolition',
    'water_electric',
    'masonry',
    'woodwork',
    'painting',
    'installation',
    'inspection',
    'final',
  ];

  constructor(scene: Phaser.Scene, config: ProgressBarConfig = {}) {
    super(scene);
    this.config = {
      width: 800,
      totalBudget: 100000,
      totalDuration: 60,
      ...config,
    };
    this.remainingBudget = this.config.totalBudget;
    this.remainingDuration = this.config.totalDuration;
    this.initialize();
  }

  protected initialize(): void {
    const { width } = this.config;
    const height = 140;
    this.setSize(width, height);

    this.createBackground();
    this.createPhaseBar();
    this.createStats();
  }

  private createBackground(): void {
    const { width } = this.config;
    const height = 140;
    this.background = this.scene.add.graphics();
    this.background.fillStyle(UI_STYLES.colors.background, 0.95);
    this.background.lineStyle(1, UI_STYLES.colors.border, 1);
    this.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    this.background.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    this.add(this.background);
  }

  private createPhaseBar(): void {
    const { width } = this.config;
    this.phaseBarContainer = this.scene.add.container(UI_STYLES.spacing.lg, UI_STYLES.spacing.lg);

    const barWidth = width - UI_STYLES.spacing.lg * 2;
    const barHeight = 24;

    const phaseTitle = this.scene.add.text(
      0,
      0,
      '施工进度',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    phaseTitle.setOrigin(0, 0);
    this.phaseBarContainer.add(phaseTitle);

    this.phaseLabel = this.scene.add.text(
      barWidth,
      0,
      PHASE_CONFIG[this.currentPhase].label,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${PHASE_CONFIG[this.currentPhase].color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.phaseLabel.setOrigin(1, 0);
    this.phaseBarContainer.add(this.phaseLabel);

    this.phaseBarBg = this.scene.add.graphics();
    this.phaseBarBg.fillStyle(UI_STYLES.colors.border, 0.5);
    this.phaseBarBg.fillRoundedRect(0, 24, barWidth, barHeight, UI_STYLES.radii.round);
    this.phaseBarContainer.add(this.phaseBarBg);

    this.createPhaseMarkers(barWidth, barHeight);

    this.phaseBarFill = this.scene.add.graphics();
    this.phaseBarContainer.add(this.phaseBarFill);

    this.phaseProgressText = this.scene.add.text(
      barWidth / 2,
      24 + barHeight / 2,
      '0%',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xs}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.phaseProgressText.setOrigin(0.5, 0.5);
    this.phaseBarContainer.add(this.phaseProgressText);

    this.phaseBarContainer.setSize(barWidth, 24 + barHeight);
    this.add(this.phaseBarContainer);
    this.updatePhaseBar();
  }

  private createPhaseMarkers(barWidth: number, barHeight: number): void {
    const phaseCount = this.phases.length;
    const phaseWidth = barWidth / phaseCount;

    for (let i = 1; i < phaseCount; i++) {
      const x = i * phaseWidth;
      const marker = this.scene.add.graphics();
      marker.lineStyle(1, UI_STYLES.colors.background, 0.8);
      marker.beginPath();
      marker.moveTo(x, 24);
      marker.lineTo(x, 24 + barHeight);
      marker.strokePath();
      this.phaseBarContainer.add(marker);
    }

    this.phases.forEach((phase, i) => {
      const phaseConfig = PHASE_CONFIG[phase];
      const label = this.scene.add.text(
        i * phaseWidth + phaseWidth / 2,
        24 + barHeight + UI_STYLES.spacing.sm + 8,
        phaseConfig.label.slice(0, 2),
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.xs}px`,
          color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
          align: 'center',
        }
      );
      label.setOrigin(0.5, 0.5);
      this.phaseBarContainer.add(label);
    });
  }

  private createStats(): void {
    const { width } = this.config;
    const statsY = 90;
    const statWidth = (width - UI_STYLES.spacing.lg * 4) / 3;

    this.statsContainer = this.scene.add.container(0, statsY);

    this.scoreStat = this.createStatItem(
      UI_STYLES.spacing.lg,
      '分数',
      this.score.toString(),
      UI_STYLES.colors.primary,
      '🏆'
    );
    this.statsContainer.add(this.scoreStat);

    this.budgetStat = this.createStatItem(
      UI_STYLES.spacing.lg + statWidth + UI_STYLES.spacing.lg,
      '预算剩余',
      `¥${this.remainingBudget.toLocaleString()}`,
      UI_STYLES.colors.success,
      '💰'
    );
    this.statsContainer.add(this.budgetStat);

    this.durationStat = this.createStatItem(
      UI_STYLES.spacing.lg + (statWidth + UI_STYLES.spacing.lg) * 2,
      '工期剩余',
      `${this.remainingDuration}天`,
      UI_STYLES.colors.info,
      '⏰'
    );
    this.statsContainer.add(this.durationStat);

    this.add(this.statsContainer);
  }

  private createStatItem(
    x: number,
    label: string,
    value: string,
    color: number,
    icon: string
  ): Phaser.GameObjects.Container {
    const { width } = this.config;
    const statWidth = (width - UI_STYLES.spacing.lg * 4) / 3;
    const container = this.scene.add.container(x, 0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_STYLES.colors.surface, 1);
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.fillRoundedRect(0, 0, statWidth, 44, UI_STYLES.radii.md);
    bg.strokeRoundedRect(0, 0, statWidth, 44, UI_STYLES.radii.md);
    container.add(bg);

    const iconText = this.scene.add.text(
      UI_STYLES.spacing.md,
      22,
      icon,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: '20px',
      }
    );
    iconText.setOrigin(0, 0.5);
    container.add(iconText);

    const labelText = this.scene.add.text(
      UI_STYLES.spacing.md + 32,
      12,
      label,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xs}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
      }
    );
    labelText.setOrigin(0, 0);
    container.add(labelText);

    const valueText = this.scene.add.text(
      UI_STYLES.spacing.md + 32,
      28,
      value,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    valueText.setOrigin(0, 0);
    container.setData('valueText', valueText);
    container.add(valueText);

    return container;
  }

  private updatePhaseBar(): void {
    const { width } = this.config;
    const barWidth = width - UI_STYLES.spacing.lg * 2;
    const barHeight = 24;
    const currentPhaseIndex = this.phases.indexOf(this.currentPhase);
    const totalProgress = (currentPhaseIndex + this.phaseProgress) / this.phases.length;

    const phaseConfig = PHASE_CONFIG[this.currentPhase];

    this.phaseBarFill.clear();

    const phaseCount = this.phases.length;
    const phaseWidth = barWidth / phaseCount;

    for (let i = 0; i <= currentPhaseIndex; i++) {
      const phase = this.phases[i];
      const config = PHASE_CONFIG[phase];
      const startX = i * phaseWidth;
      let endX = (i + 1) * phaseWidth;

      if (i === currentPhaseIndex) {
        endX = startX + phaseWidth * this.phaseProgress;
      }

      this.phaseBarFill.fillStyle(config.color, 1);
      this.phaseBarFill.fillRoundedRect(startX, 24, endX - startX, barHeight, {
        tl: i === 0 ? UI_STYLES.radii.round : 0,
        bl: i === 0 ? UI_STYLES.radii.round : 0,
        tr: i === currentPhaseIndex && this.phaseProgress >= 1 ? UI_STYLES.radii.round : 0,
        br: i === currentPhaseIndex && this.phaseProgress >= 1 ? UI_STYLES.radii.round : 0,
      });
    }

    const progressPercent = Math.round(totalProgress * 100);
    this.phaseProgressText.setText(`${progressPercent}%`);

    this.phaseLabel.setText(phaseConfig.label);
    this.phaseLabel.setColor(`#${phaseConfig.color.toString(16).padStart(6, '0')}`);
  }

  public setPhase(phase: ConstructionPhase, progress: number = 0): ProgressBar {
    this.currentPhase = phase;
    this.phaseProgress = Phaser.Math.Clamp(progress, 0, 1);
    this.updatePhaseBar();
    return this;
  }

  public setPhaseProgress(progress: number): ProgressBar {
    this.phaseProgress = Phaser.Math.Clamp(progress, 0, 1);
    this.updatePhaseBar();
    return this;
  }

  public nextPhase(): ProgressBar {
    const currentIndex = this.phases.indexOf(this.currentPhase);
    if (currentIndex < this.phases.length - 1) {
      this.currentPhase = this.phases[currentIndex + 1];
      this.phaseProgress = 0;
      this.updatePhaseBar();
    }
    return this;
  }

  public setScore(score: number): ProgressBar {
    this.score = Math.max(0, score);
    const valueText = this.scoreStat.getData('valueText') as Phaser.GameObjects.Text;
    if (valueText) {
      valueText.setText(this.score.toString());
    }
    return this;
  }

  public addScore(amount: number): ProgressBar {
    return this.setScore(this.score + amount);
  }

  public setRemainingBudget(budget: number): ProgressBar {
    this.remainingBudget = Math.max(0, budget);
    const valueText = this.budgetStat.getData('valueText') as Phaser.GameObjects.Text;
    if (valueText) {
      valueText.setText(`¥${this.remainingBudget.toLocaleString()}`);
      const percent = this.remainingBudget / this.config.totalBudget;
      let color = UI_STYLES.colors.success;
      if (percent < 0.2) {
        color = UI_STYLES.colors.danger;
      } else if (percent < 0.5) {
        color = UI_STYLES.colors.warning;
      }
      valueText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    }
    return this;
  }

  public deductBudget(amount: number): ProgressBar {
    return this.setRemainingBudget(this.remainingBudget - amount);
  }

  public setRemainingDuration(duration: number): ProgressBar {
    this.remainingDuration = Math.max(0, duration);
    const valueText = this.durationStat.getData('valueText') as Phaser.GameObjects.Text;
    if (valueText) {
      valueText.setText(`${this.remainingDuration}天`);
      const percent = this.remainingDuration / this.config.totalDuration;
      let color = UI_STYLES.colors.info;
      if (percent < 0.2) {
        color = UI_STYLES.colors.danger;
      } else if (percent < 0.5) {
        color = UI_STYLES.colors.warning;
      }
      valueText.setColor(`#${color.toString(16).padStart(6, '0')}`);
    }
    return this;
  }

  public deductDuration(days: number): ProgressBar {
    return this.setRemainingDuration(this.remainingDuration - days);
  }

  public animatePhaseProgress(targetProgress: number, duration: number = 500): ProgressBar {
    const startProgress = this.phaseProgress;
    const endProgress = Phaser.Math.Clamp(targetProgress, 0, 1);

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      ease: UI_STYLES.animation.ease,
      onUpdate: (tween) => {
        const value = tween.getValue() ?? 0;
        this.phaseProgress = startProgress + (endProgress - startProgress) * value;
        this.updatePhaseBar();
      },
    });

    return this;
  }

  public getProgress(): { phase: ConstructionPhase; progress: number; totalPercent: number } {
    const currentPhaseIndex = this.phases.indexOf(this.currentPhase);
    const totalPercent = ((currentPhaseIndex + this.phaseProgress) / this.phases.length) * 100;
    return {
      phase: this.currentPhase,
      progress: this.phaseProgress,
      totalPercent,
    };
  }
}
