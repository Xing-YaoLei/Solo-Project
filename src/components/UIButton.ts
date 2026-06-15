import { COLORS } from '../types';

export class UIButton extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  private onClickCallback: (() => void) | null = null;
  private normalColor: number;
  private hoverColor: number;
  private pressedColor: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    fontSize: number = 18,
    color: number = COLORS.primary,
    hoverColor?: number
  ) {
    super(scene, x, y);
    this.setSize(width, height);

    this.normalColor = color;
    this.hoverColor = hoverColor || this.adjustBrightness(color, 20);
    this.pressedColor = this.adjustBrightness(color, -20);

    this.background = scene.add.rectangle(0, 0, width, height, this.normalColor)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, COLORS.border);

    this.text = scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    this.add([this.background, this.text]);

    this.setupInteraction();
    scene.add.existing(this);
  }

  private setupInteraction(): void {
    this.setSize(this.background.width, this.background.height);
    this.setInteractive({ useHandCursor: true });

    this.on('pointerover', () => this.onPointerOver());
    this.on('pointerout', () => this.onPointerOut());
    this.on('pointerdown', () => this.onPointerDown());
    this.on('pointerup', () => this.onPointerUp());
    this.on('pointerupoutside', () => this.onPointerUpOutside());
  }

  private onPointerOver(): void {
    if (!this.active) return;
    this.isHovered = true;
    this.updateVisualState();
  }

  private onPointerOut(): void {
    if (!this.active) return;
    this.isHovered = false;
    this.isPressed = false;
    this.updateVisualState();
  }

  private onPointerDown(): void {
    if (!this.active) return;
    this.isPressed = true;
    this.updateVisualState();
  }

  private onPointerUp(): void {
    if (!this.active) return;
    const wasPressed = this.isPressed;
    this.isPressed = false;
    this.isHovered = true;
    this.updateVisualState();

    if (wasPressed && this.onClickCallback) {
      this.onClickCallback();
    }
  }

  private onPointerUpOutside(): void {
    if (!this.active) return;
    this.isPressed = false;
    this.isHovered = false;
    this.updateVisualState();
  }

  private updateVisualState(): void {
    if (this.isPressed) {
      this.background.fillColor = this.pressedColor;
      this.scale = 0.95;
    } else if (this.isHovered) {
      this.background.fillColor = this.hoverColor;
      this.scale = 1.02;
    } else {
      this.background.fillColor = this.normalColor;
      this.scale = 1;
    }
  }

  private adjustBrightness(color: number, amount: number): number {
    const r = Math.min(255, Math.max(0, ((color >> 16) & 255) + amount));
    const g = Math.min(255, Math.max(0, ((color >> 8) & 255) + amount));
    const b = Math.min(255, Math.max(0, (color & 255) + amount));
    return (r << 16) | (g << 8) | b;
  }

  setOnClick(callback: () => void): this {
    this.onClickCallback = callback;
    return this;
  }

  setText(text: string): this {
    this.text.setText(text);
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.active = enabled;
    this.alpha = enabled ? 1 : 0.5;
    return this;
  }

  setColor(color: number): this {
    this.normalColor = color;
    this.hoverColor = this.adjustBrightness(color, 20);
    this.pressedColor = this.adjustBrightness(color, -20);
    this.updateVisualState();
    return this;
  }

  getText(): string {
    return this.text.text;
  }

  getTextObject(): Phaser.GameObjects.Text {
    return this.text;
  }
}
