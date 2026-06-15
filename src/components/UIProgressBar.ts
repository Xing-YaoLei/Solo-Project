import { COLORS } from '../types';

export class UIProgressBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private labelText: Phaser.GameObjects.Text | null = null;
  private valueText: Phaser.GameObjects.Text | null = null;
  private currentValue: number = 0;
  private maxValue: number = 100;
  private showPercentage: boolean = false;
  private fillColor: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: number = COLORS.primary,
    showLabel: boolean = false,
    showValue: boolean = false
  ) {
    super(scene, x, y);
    this.fillColor = fillColor;

    this.background = scene.add.rectangle(0, 0, width, height, COLORS.surface)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, COLORS.border);

    this.fill = scene.add.rectangle(0, 0, 2, height - 4, fillColor)
      .setOrigin(0, 0.5);

    if (showLabel) {
      this.labelText = scene.add.text(-10, 0, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(1, 0.5);
    }

    if (showValue) {
      this.valueText = scene.add.text(width + 10, 0, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5);
    }

    const children: Phaser.GameObjects.GameObject[] = [this.background, this.fill];
    if (this.labelText) children.push(this.labelText);
    if (this.valueText) children.push(this.valueText);

    this.add(children);
    scene.add.existing(this);
  }

  setValue(value: number, animate: boolean = true): this {
    const newWidth = Math.max(0, Math.min(this.background.width - 4,
      (value / this.maxValue) * (this.background.width - 4)));

    if (animate) {
      this.scene.tweens.add({
        targets: this.fill,
        width: newWidth,
        duration: 300,
        ease: 'Power2.out'
      });
    } else {
      this.fill.width = newWidth;
    }

    this.currentValue = value;
    this.updateValueText();
    this.updateFillColor();

    return this;
  }

  setMaxValue(maxValue: number): this {
    this.maxValue = maxValue;
    this.setValue(this.currentValue, false);
    return this;
  }

  setLabel(label: string): this {
    if (this.labelText) {
      this.labelText.setText(label);
    }
    return this;
  }

  setShowPercentage(show: boolean): this {
    this.showPercentage = show;
    this.updateValueText();
    return this;
  }

  setFillColor(color: number): this {
    this.fillColor = color;
    this.fill.fillColor = color;
    return this;
  }

  private updateValueText(): void {
    if (!this.valueText) return;

    if (this.showPercentage) {
      const percentage = (this.currentValue / this.maxValue) * 100;
      this.valueText.setText(`${percentage.toFixed(1)}%`);
    } else {
      this.valueText.setText(`${Math.round(this.currentValue)} / ${this.maxValue}`);
    }
  }

  private updateFillColor(): void {
    const percentage = this.currentValue / this.maxValue;
    if (percentage >= 0.8) {
      this.fill.fillColor = this.fillColor;
    } else if (percentage >= 0.5) {
      this.fill.fillColor = COLORS.warning;
    } else {
      this.fill.fillColor = COLORS.danger;
    }
  }

  getValue(): number {
    return this.currentValue;
  }

  getMaxValue(): number {
    return this.maxValue;
  }
}
