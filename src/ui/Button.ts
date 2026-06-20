import { GameObjects, Scene } from 'phaser';
import { COLORS } from '../utils/constants';

export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  backgroundColor?: string;
  hoverColor?: string;
  textColor?: string;
  fontSize?: number;
  radius?: number;
  onClick?: () => void;
}

export class Button extends GameObjects.Container {
  private background: GameObjects.Graphics;
  private textObj: GameObjects.Text;
  private config: Required<ButtonConfig>;
  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor(scene: Scene, config: ButtonConfig) {
    super(scene, config.x, config.y);
    
    this.config = {
      backgroundColor: COLORS.primary,
      hoverColor: COLORS.accent,
      textColor: COLORS.white,
      fontSize: 18,
      radius: 8,
      onClick: () => {},
      ...config,
    };

    this.background = scene.add.graphics();
    this.add(this.background);

    this.textObj = scene.add.text(0, 0, this.config.text, {
      fontSize: `${this.config.fontSize}px`,
      color: this.config.textColor,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    this.textObj.setOrigin(0.5);
    this.add(this.textObj);

    this.setSize(this.config.width, this.config.height);
    this.setInteractive({ useHandCursor: true });
    
    this.drawBackground();
    this.setupEvents();
    
    scene.add.existing(this);
  }

  private drawBackground(): void {
    const { width, height, radius, backgroundColor } = this.config;
    const color = Phaser.Display.Color.HexStringToColor(backgroundColor).color;

    this.background.clear();
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

    const shadowColor = Phaser.Display.Color.HexStringToColor('#000000').color;
    this.background.fillStyle(shadowColor, 0.15);
    this.background.fillRoundedRect(-width / 2 + 2, -height / 2 + 4, width, height, radius);
  }

  private setupEvents(): void {
    this.on('pointerover', () => {
      this.isHovered = true;
      this.updateVisualState();
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.isPressed = false;
      this.updateVisualState();
    });

    this.on('pointerdown', () => {
      this.isPressed = true;
      this.updateVisualState();
    });

    this.on('pointerup', () => {
      if (this.isPressed) {
        this.isPressed = false;
        this.updateVisualState();
        this.config.onClick?.();
      }
    });
  }

  private updateVisualState(): void {
    const { backgroundColor, hoverColor, width, height, radius } = this.config;
    
    let colorHex = backgroundColor;
    let yOffset = 0;

    if (this.isHovered) {
      colorHex = hoverColor;
    }
    if (this.isPressed) {
      yOffset = 2;
    }

    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;
    
    this.background.clear();
    
    this.background.fillStyle(Phaser.Display.Color.HexStringToColor('#000000').color, 0.15);
    this.background.fillRoundedRect(-width / 2 + 2, -height / 2 + 4 + yOffset, width, height, radius);
    
    this.background.fillStyle(color, 1);
    this.background.fillRoundedRect(-width / 2, -height / 2 + yOffset, width, height, radius);

    this.textObj.y = yOffset;
  }

  setText(text: string): void {
    this.config.text = text;
    this.textObj.setText(text);
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.setInteractive({ useHandCursor: true });
      this.setAlpha(1);
    } else {
      this.disableInteractive();
      this.setAlpha(0.5);
    }
  }
}
