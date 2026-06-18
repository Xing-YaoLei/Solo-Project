import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES } from './styles';

export interface TutorialStep {
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  title: string;
  description: string;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  highlightRadius?: number;
}

export interface TutorialOverlayConfig {
  onStepComplete?: (stepIndex: number) => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

export class TutorialOverlay extends BaseComponent<TutorialOverlay> {
  private steps: TutorialStep[] = [];
  private currentStepIndex = 0;
  private config: Required<TutorialOverlayConfig>;
  private overlay!: Phaser.GameObjects.Graphics;
  private highlight!: Phaser.GameObjects.Graphics;
  private arrow!: Phaser.GameObjects.Graphics;
  private tooltip!: Phaser.GameObjects.Container;
  private tooltipBackground!: Phaser.GameObjects.Graphics;
  private tooltipTitle!: Phaser.GameObjects.Text;
  private tooltipDescription!: Phaser.GameObjects.Text;
  private stepIndicator!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Container;
  private nextButton!: Phaser.GameObjects.Container;
  private skipButton!: Phaser.GameObjects.Container;
  private pulseTween!: Phaser.Tweens.Tween | null;

  constructor(scene: Phaser.Scene, steps: TutorialStep[] = [], config: TutorialOverlayConfig = {}) {
    super(scene);
    this.steps = steps;
    this.config = {
      onStepComplete: () => {},
      onComplete: () => {},
      onSkip: () => {},
      ...config,
    };
    this.initialize();
  }

  protected initialize(): void {
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;
    this.setSize(gameWidth, gameHeight);
    this.setDepth(2000);

    this.createOverlay();
    this.createHighlight();
    this.createArrow();
    this.createTooltip();
    this.createSkipButton();

    if (this.steps.length > 0) {
      this.showStep(0);
    }
  }

  private createOverlay(): void {
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    this.overlay = this.scene.add.graphics();
    this.overlay.fillStyle(UI_STYLES.colors.overlay, 0.7);
    this.overlay.fillRect(0, 0, gameWidth, gameHeight);

    this.overlay.setInteractive(
      new Phaser.Geom.Rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight),
      Phaser.Geom.Rectangle.Contains
    );

    this.add(this.overlay);
  }

  private createHighlight(): void {
    this.highlight = this.scene.add.graphics();
    this.add(this.highlight);
  }

  private createArrow(): void {
    this.arrow = this.scene.add.graphics();
    this.add(this.arrow);
  }

  private createTooltip(): void {
    this.tooltip = this.scene.add.container(0, 0);

    this.tooltipBackground = this.scene.add.graphics();
    this.tooltip.add(this.tooltipBackground);

    this.tooltipTitle = this.scene.add.text(0, 0, '', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
      color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      wordWrap: { width: 320 },
    });
    this.tooltipTitle.setOrigin(0, 0);
    this.tooltip.add(this.tooltipTitle);

    this.tooltipDescription = this.scene.add.text(0, 0, '', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.md}px`,
      color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
      wordWrap: { width: 320 },
      lineSpacing: 4,
    });
    this.tooltipDescription.setOrigin(0, 0);
    this.tooltip.add(this.tooltipDescription);

    this.stepIndicator = this.scene.add.text(0, 0, '', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
      color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
    });
    this.stepIndicator.setOrigin(0, 0);
    this.tooltip.add(this.stepIndicator);

    this.prevButton = this.createNavButton('上一步', 0, true);
    this.nextButton = this.createNavButton('下一步', 0, false);

    this.tooltip.add(this.prevButton);
    this.tooltip.add(this.nextButton);
    this.add(this.tooltip);
  }

  private createNavButton(label: string, x: number, isPrev: boolean): Phaser.GameObjects.Container {
    const btnWidth = 100;
    const btnHeight = 36;
    const container = this.scene.add.container(x, 0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(isPrev ? UI_STYLES.colors.border : UI_STYLES.colors.primary, 1);
    bg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
    container.add(bg);

    const text = this.scene.add.text(btnWidth / 2, btnHeight / 2, label, {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
      color: isPrev ? `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}` : '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    container.setSize(btnWidth, btnHeight);
    container.setInteractive(
      new Phaser.Geom.Rectangle(btnWidth / 2, btnHeight / 2, btnWidth, btnHeight),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      if (this.isDisabled) return;
      bg.clear();
      if (isPrev) {
        bg.fillStyle(UI_STYLES.colors.primary, 0.1);
      } else {
        bg.fillStyle(UI_STYLES.colors.secondary, 1);
      }
      bg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(isPrev ? UI_STYLES.colors.border : UI_STYLES.colors.primary, 1);
      bg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      if (this.isDisabled) return;
      if (isPrev) {
        this.prevStep();
      } else {
        this.nextStep();
      }
    });

    return container;
  }

  private createSkipButton(): void {
    const gameWidth = this.scene.scale.width;
    this.skipButton = this.scene.add.container(gameWidth - UI_STYLES.spacing.lg - 80, UI_STYLES.spacing.lg);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(0, 0, 80, 32, UI_STYLES.radii.round);
    this.skipButton.add(bg);

    const text = this.scene.add.text(40, 16, '跳过教程', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);
    this.skipButton.add(text);

    this.skipButton.setSize(80, 32);
    this.skipButton.setInteractive(
      new Phaser.Geom.Rectangle(40, 16, 80, 32),
      Phaser.Geom.Rectangle.Contains
    );

    this.skipButton.on('pointerover', () => {
      if (this.isDisabled) return;
      bg.clear();
      bg.fillStyle(0xffffff, 0.25);
      bg.fillRoundedRect(0, 0, 80, 32, UI_STYLES.radii.round);
      this.scene.input.setDefaultCursor('pointer');
    });

    this.skipButton.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRoundedRect(0, 0, 80, 32, UI_STYLES.radii.round);
      this.scene.input.setDefaultCursor('default');
    });

    this.skipButton.on('pointerdown', () => {
      if (this.isDisabled) return;
      this.config.onSkip();
      this.hide();
    });

    this.add(this.skipButton);
  }

  private showStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return;

    this.currentStepIndex = index;
    const step = this.steps[index];

    this.updateHighlight(step);
    this.updateArrow(step);
    this.updateTooltip(step);
    this.startPulseAnimation(step);
    this.config.onStepComplete(index);
  }

  private updateHighlight(step: TutorialStep): void {
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;
    const radius = step.highlightRadius || UI_STYLES.radii.lg;

    this.highlight.clear();

    this.highlight.fillStyle(UI_STYLES.colors.overlay, 0.7);
    this.highlight.beginPath();
    this.highlight.moveTo(0, 0);
    this.highlight.lineTo(gameWidth, 0);
    this.highlight.lineTo(gameWidth, gameHeight);
    this.highlight.lineTo(0, gameHeight);
    this.highlight.lineTo(0, step.targetY);
    this.highlight.lineTo(step.targetX, step.targetY);
    this.highlight.lineTo(step.targetX, step.targetY + step.targetHeight);
    this.highlight.lineTo(step.targetX + step.targetWidth, step.targetY + step.targetHeight);
    this.highlight.lineTo(step.targetX + step.targetWidth, step.targetY);
    this.highlight.lineTo(0, step.targetY);
    this.highlight.closePath();
    this.highlight.fillPath();

    this.highlight.lineStyle(3, UI_STYLES.colors.primary, 1);
    this.highlight.strokeRoundedRect(step.targetX, step.targetY, step.targetWidth, step.targetHeight, radius);
  }

  private updateArrow(step: TutorialStep): void {
    this.arrow.clear();

    const direction = step.arrowDirection || 'down';
    let arrowX = step.targetX + step.targetWidth / 2;
    let arrowY = step.targetY + step.targetHeight / 2;
    const arrowSize = 20;

    const offset = 60;

    switch (direction) {
      case 'up':
        arrowY = step.targetY - offset;
        this.drawArrow(arrowX, arrowY, arrowX, arrowY + 30, arrowSize);
        break;
      case 'down':
        arrowY = step.targetY + step.targetHeight + offset;
        this.drawArrow(arrowX, arrowY, arrowX, arrowY - 30, arrowSize);
        break;
      case 'left':
        arrowX = step.targetX - offset;
        this.drawArrow(arrowX, arrowY, arrowX + 30, arrowY, arrowSize);
        break;
      case 'right':
        arrowX = step.targetX + step.targetWidth + offset;
        this.drawArrow(arrowX, arrowY, arrowX - 30, arrowY, arrowSize);
        break;
    }
  }

  private drawArrow(fromX: number, fromY: number, toX: number, toY: number, size: number): void {
    this.arrow.lineStyle(4, UI_STYLES.colors.primary, 1);
    this.arrow.beginPath();
    this.arrow.moveTo(fromX, fromY);
    this.arrow.lineTo(toX, toY);
    this.arrow.strokePath();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = size * 0.8;

    this.arrow.fillStyle(UI_STYLES.colors.primary, 1);
    this.arrow.beginPath();
    this.arrow.moveTo(toX, toY);
    this.arrow.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.arrow.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.arrow.closePath();
    this.arrow.fillPath();
  }

  private updateTooltip(step: TutorialStep): void {
    const tooltipWidth = 360;
    const padding = UI_STYLES.spacing.lg;
    const direction = step.arrowDirection || 'down';

    let tooltipX = step.targetX + step.targetWidth / 2 - tooltipWidth / 2;
    let tooltipY = 0;

    switch (direction) {
      case 'up':
        tooltipY = step.targetY - 200;
        break;
      case 'down':
        tooltipY = step.targetY + step.targetHeight + 80;
        break;
      case 'left':
        tooltipX = step.targetX - tooltipWidth - 80;
        tooltipY = step.targetY + step.targetHeight / 2 - 100;
        break;
      case 'right':
        tooltipX = step.targetX + step.targetWidth + 80;
        tooltipY = step.targetY + step.targetHeight / 2 - 100;
        break;
    }

    tooltipX = Phaser.Math.Clamp(tooltipX, UI_STYLES.spacing.lg, this.scene.scale.width - tooltipWidth - UI_STYLES.spacing.lg);
    tooltipY = Phaser.Math.Clamp(tooltipY, UI_STYLES.spacing.lg, this.scene.scale.height - 220);

    this.tooltipTitle.setText(step.title);
    this.tooltipTitle.setPosition(padding, padding);

    this.tooltipDescription.setText(step.description);
    this.tooltipDescription.setPosition(padding, padding + 32);

    const contentHeight = padding + 32 + this.tooltipDescription.height + UI_STYLES.spacing.xl;
    const tooltipHeight = contentHeight + 60;

    this.stepIndicator.setText(`${this.currentStepIndex + 1} / ${this.steps.length}`);
    this.stepIndicator.setPosition(padding, contentHeight + 8);

    this.prevButton.setPosition(padding, contentHeight + 28);
    this.prevButton.setVisible(this.currentStepIndex > 0);

    const isLastStep = this.currentStepIndex === this.steps.length - 1;
    const nextBtnText = this.nextButton.getAt(1) as Phaser.GameObjects.Text;
    nextBtnText.setText(isLastStep ? '完成' : '下一步');
    this.nextButton.setPosition(tooltipWidth - padding - this.nextButton.width, contentHeight + 28);

    this.tooltipBackground.clear();
    this.tooltipBackground.fillStyle(UI_STYLES.colors.background, 1);
    this.tooltipBackground.lineStyle(1, UI_STYLES.colors.border, 1);
    this.tooltipBackground.fillRoundedRect(0, 0, tooltipWidth, tooltipHeight, UI_STYLES.radii.lg);
    this.tooltipBackground.strokeRoundedRect(0, 0, tooltipWidth, tooltipHeight, UI_STYLES.radii.lg);

    this.tooltip.setPosition(tooltipX, tooltipY);
    this.tooltip.setSize(tooltipWidth, tooltipHeight);
  }

  private startPulseAnimation(step: TutorialStep): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
    }

    const centerX = step.targetX + step.targetWidth / 2;
    const centerY = step.targetY + step.targetHeight / 2;
    const maxRadius = Math.max(step.targetWidth, step.targetHeight) / 2 + 20;

    const pulseCircle = this.scene.add.graphics();
    pulseCircle.setPosition(centerX, centerY);
    this.add(pulseCircle);

    this.pulseTween = this.scene.tweens.add({
      targets: { scale: 0, alpha: 0.8 },
      scale: 1,
      alpha: 0,
      duration: 1500,
      repeat: -1,
      ease: 'Sine.easeOut',
      onUpdate: (tween) => {
        const { scale, alpha } = tween.targets[0] as { scale: number; alpha: number };
        pulseCircle.clear();
        pulseCircle.lineStyle(3, UI_STYLES.colors.primary, alpha);
        pulseCircle.strokeCircle(0, 0, maxRadius * scale);
      },
      onComplete: () => {
        pulseCircle.destroy();
      },
    });
  }

  public nextStep(): TutorialOverlay {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.showStep(this.currentStepIndex + 1);
    } else {
      this.config.onComplete();
      this.hide();
    }
    return this;
  }

  public prevStep(): TutorialOverlay {
    if (this.currentStepIndex > 0) {
      this.showStep(this.currentStepIndex - 1);
    }
    return this;
  }

  public goToStep(index: number): TutorialOverlay {
    this.showStep(index);
    return this;
  }

  public setSteps(steps: TutorialStep[]): TutorialOverlay {
    this.steps = steps;
    this.currentStepIndex = 0;
    if (steps.length > 0) {
      this.showStep(0);
    }
    return this;
  }

  public show(): this {
    this.setAlpha(0);
    this.setVisible(true);
    this.fadeIn();
    return this;
  }

  public hide(): this {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    this.fadeOut();
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: UI_STYLES.animation.duration.normal,
      ease: UI_STYLES.animation.ease,
      onComplete: () => {
        this.setVisible(false);
      },
    });
    return this;
  }

  public onStepComplete(callback: (stepIndex: number) => void): TutorialOverlay {
    this.config.onStepComplete = callback;
    return this;
  }

  public onComplete(callback: () => void): TutorialOverlay {
    this.config.onComplete = callback;
    return this;
  }

  public onSkip(callback: () => void): TutorialOverlay {
    this.config.onSkip = callback;
    return this;
  }

  public getCurrentStep(): number {
    return this.currentStepIndex;
  }

  public getTotalSteps(): number {
    return this.steps.length;
  }
}
