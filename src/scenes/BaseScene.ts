import Phaser from 'phaser';
import {
  eventBus,
  configManager,
  saveSystem,
  audioManager,
  GameEvent,
} from '../core';

export const COLORS = {
  PRIMARY: 0x1e3a5f,
  PRIMARY_LIGHT: 0x2a4a7f,
  PRIMARY_DARK: 0x0f2540,
  ACCENT: 0xff6b35,
  ACCENT_LIGHT: 0xff8a5c,
  ACCENT_DARK: 0xcc5529,
  TEXT: 0xffffff,
  TEXT_SECONDARY: 0x8fa4c2,
  TEXT_DISABLED: 0x5a6b8a,
  SUCCESS: 0x2ecc71,
  WARNING: 0xf39c12,
  ERROR: 0xe74c3c,
  BACKGROUND: 0x0a1628,
  PANEL: 0x162a45,
  PANEL_BORDER: 0x2d4a6f,
} as const;

export const FONT_FAMILY =
  "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif";

export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize?: number;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface UIElement {
  container: Phaser.GameObjects.Container;
  destroy: () => void;
  setVisible: (visible: boolean) => void;
  setEnabled: (enabled: boolean) => void;
}

export abstract class BaseScene extends Phaser.Scene {
  protected eventBus = eventBus;
  protected configManager = configManager;
  protected saveSystem = saveSystem;
  protected audioManager = audioManager;

  protected uiElements: Map<string, UIElement> = new Map();
  protected eventUnsubscribers: (() => void)[] = [];

  constructor(sceneKey: string) {
    super(sceneKey);
  }

  create(): void {
    this.setupEventListeners();
  }

  protected setupEventListeners(): void {}

  protected addEventListener(
    event: string,
    callback: (data: unknown) => void,
    priority?: number
  ): void {
    const unsubscribe = this.eventBus.on(event, callback, priority);
    this.eventUnsubscribers.push(unsubscribe);
  }

  protected emitEvent<T = unknown>(event: string, data?: T): void {
    this.eventBus.emit(event, data);
  }

  createButton(config: ButtonConfig): UIElement {
    const {
      x,
      y,
      width,
      height,
      text,
      fontSize = 20,
      onClick,
      disabled = false,
      variant = 'primary',
    } = config;

    const container = this.add.container(x, y);

    let bgColor: number;
    let bgColorHover: number;
    let bgColorDown: number;
    let borderColor: number;
    let textColor: number;

    switch (variant) {
      case 'secondary':
        bgColor = COLORS.PANEL;
        bgColorHover = COLORS.PRIMARY_LIGHT;
        bgColorDown = COLORS.PRIMARY_DARK;
        borderColor = COLORS.PANEL_BORDER;
        textColor = COLORS.TEXT;
        break;
      case 'outline':
        bgColor = 0x00000000;
        bgColorHover = COLORS.PRIMARY;
        bgColorDown = COLORS.PRIMARY_DARK;
        borderColor = COLORS.ACCENT;
        textColor = COLORS.ACCENT;
        break;
      case 'primary':
      default:
        bgColor = COLORS.ACCENT;
        bgColorHover = COLORS.ACCENT_LIGHT;
        bgColorDown = COLORS.ACCENT_DARK;
        borderColor = COLORS.ACCENT_DARK;
        textColor = COLORS.TEXT;
        break;
    }

    const background = this.add.rectangle(0, 0, width, height, bgColor);
    background.setStrokeStyle(2, borderColor);
    background.setAlpha(disabled ? 0.5 : 1);

    const corners = this.add.graphics();
    corners.lineStyle(2, borderColor, disabled ? 0.5 : 1);
    const cornerSize = 8;
    corners.beginPath();
    corners.moveTo(-width / 2 + cornerSize, -height / 2);
    corners.lineTo(-width / 2, -height / 2);
    corners.lineTo(-width / 2, -height / 2 + cornerSize);
    corners.moveTo(width / 2 - cornerSize, -height / 2);
    corners.lineTo(width / 2, -height / 2);
    corners.lineTo(width / 2, -height / 2 + cornerSize);
    corners.moveTo(-width / 2 + cornerSize, height / 2);
    corners.lineTo(-width / 2, height / 2);
    corners.lineTo(-width / 2, height / 2 - cornerSize);
    corners.moveTo(width / 2 - cornerSize, height / 2);
    corners.lineTo(width / 2, height / 2);
    corners.lineTo(width / 2, height / 2 - cornerSize);
    corners.strokePath();

    const textObject = this.add
      .text(0, 0, text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: `#${textColor.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    container.add([background, corners, textObject]);

    if (!disabled) {
      background.setInteractive({ useHandCursor: true });

      background.on('pointerover', () => {
        background.fillColor = bgColorHover;
        if (variant === 'outline') {
          textObject.setColor(`#${COLORS.TEXT.toString(16).padStart(6, '0')}`);
        }
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
      });

      background.on('pointerout', () => {
        background.fillColor = bgColor;
        if (variant === 'outline') {
          textObject.setColor(`#${COLORS.ACCENT.toString(16).padStart(6, '0')}`);
        }
      });

      background.on('pointerdown', () => {
        background.fillColor = bgColorDown;
      });

      background.on('pointerup', () => {
        background.fillColor = bgColorHover;
        onClick();
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'click' });
      });
    }

    const element: UIElement = {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: (enabled: boolean) => {
        background.disableInteractive();
        if (enabled) {
          background.setInteractive({ useHandCursor: true });
        }
        background.setAlpha(enabled ? 1 : 0.5);
        corners.setAlpha(enabled ? 1 : 0.5);
      },
    };

    return element;
  }

  createBackground(dynamic = false): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.BACKGROUND);

    const gridSize = 50;
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, COLORS.PANEL_BORDER, 0.15);

    for (let x = 0; x <= width; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, height);
      gridGraphics.strokePath();
    }

    for (let y = 0; y <= height; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(width, y);
      gridGraphics.strokePath();
    }

    const accentLine = this.add.graphics();
    accentLine.lineStyle(3, COLORS.ACCENT, 0.8);
    accentLine.beginPath();
    accentLine.moveTo(0, height * 0.15);
    accentLine.lineTo(width * 0.1, height * 0.15);
    accentLine.moveTo(width * 0.9, height * 0.85);
    accentLine.lineTo(width, height * 0.85);
    accentLine.strokePath();

    if (dynamic) {
      const particleGraphics = this.add.graphics();

      const particleData: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        size: number;
        alpha: number;
      }[] = [];

      for (let i = 0; i < 30; i++) {
        particleData.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.3,
          size: 2 + Math.random() * 4,
          alpha: 0.1 + Math.random() * 0.3,
        });
      }

      this.time.addEvent({
        delay: 16,
        loop: true,
        callback: () => {
          particleGraphics.clear();

          for (const p of particleData) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            particleGraphics.fillStyle(COLORS.ACCENT, p.alpha);
            particleGraphics.fillCircle(p.x, p.y, p.size);
          }
        },
      });
    }
  }

  createPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const background = this.add.rectangle(0, 0, width, height, COLORS.PANEL);
    background.setStrokeStyle(2, COLORS.PANEL_BORDER);

    const cornerSize = 12;
    const corners = this.add.graphics();
    corners.lineStyle(3, COLORS.ACCENT, 1);
    corners.beginPath();
    corners.moveTo(-width / 2 + cornerSize, -height / 2);
    corners.lineTo(-width / 2, -height / 2);
    corners.lineTo(-width / 2, -height / 2 + cornerSize);
    corners.moveTo(width / 2 - cornerSize, -height / 2);
    corners.lineTo(width / 2, -height / 2);
    corners.lineTo(width / 2, -height / 2 + cornerSize);
    corners.moveTo(-width / 2 + cornerSize, height / 2);
    corners.lineTo(-width / 2, height / 2);
    corners.lineTo(-width / 2, height / 2 - cornerSize);
    corners.moveTo(width / 2 - cornerSize, height / 2);
    corners.lineTo(width / 2, height / 2);
    corners.lineTo(width / 2, height / 2 - cornerSize);
    corners.strokePath();

    container.add([background, corners]);

    if (title) {
      const titleBg = this.add.rectangle(
        0,
        -height / 2 + 25,
        width * 0.6,
        40,
        COLORS.ACCENT
      );
      const titleText = this.add
        .text(0, -height / 2 + 25, title, {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      const titleDecorLeft = this.add.rectangle(
        -width / 2 + 20,
        -height / 2 + 25,
        30,
        3,
        COLORS.ACCENT
      );
      const titleDecorRight = this.add.rectangle(
        width / 2 - 20,
        -height / 2 + 25,
        30,
        3,
        COLORS.ACCENT
      );

      container.add([
        titleBg,
        titleText,
        titleDecorLeft,
        titleDecorRight,
      ]);
    }

    return container;
  }

  createText(
    x: number,
    y: number,
    text: string,
    config?: {
      fontSize?: number;
      color?: number;
      fontStyle?: string;
      origin?: { x: number; y: number };
    }
  ): Phaser.GameObjects.Text {
    const {
      fontSize = 16,
      color = COLORS.TEXT,
      fontStyle = 'normal',
      origin = { x: 0.5, y: 0.5 },
    } = config || {};

    return this.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle,
      })
      .setOrigin(origin.x, origin.y);
  }

  transitionToScene(sceneKey: string, data?: object): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      COLORS.BACKGROUND
    );
    overlay.setAlpha(0);
    overlay.setDepth(1000);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.scene.start(sceneKey, data);
      },
    });
  }

  fadeIn(duration = 500): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      COLORS.BACKGROUND
    );
    overlay.setDepth(1000);

    this.tweens.add({
      targets: overlay,
      alpha: 0,
      duration,
      ease: 'Power2.easeOut',
      onComplete: () => {
        overlay.destroy();
      },
    });
  }

  shake(
    target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.Text,
    intensity = 5
  ): void {
    const originalX = target.x;
    const originalY = target.y;

    this.tweens.add({
      targets: target,
      x: {
        getEnd: () => originalX + (Math.random() - 0.5) * intensity * 2,
        getStart: () => originalX,
      },
      y: {
        getEnd: () => originalY + (Math.random() - 0.5) * intensity * 2,
        getStart: () => originalY,
      },
      duration: 50,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        target.setPosition(originalX, originalY);
      },
    });
  }

  protected cleanupEventListeners(): void {
    for (const unsubscribe of this.eventUnsubscribers) {
      unsubscribe();
    }
    this.eventUnsubscribers = [];
  }

  protected cleanupUI(): void {
    for (const element of this.uiElements.values()) {
      element.destroy();
    }
    this.uiElements.clear();
  }

  destroy(): void {
    this.cleanupEventListeners();
    this.cleanupUI();
  }
}
