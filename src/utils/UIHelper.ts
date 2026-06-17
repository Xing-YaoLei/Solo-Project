import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { SoundManager } from '../data/SoundManager';
import { SettingsManager } from '../data/SettingsManager';

export class UIHelper {
  public static createButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    callback: () => void,
    options?: {
      bgColor?: number;
      hoverColor?: number;
      textColor?: string;
      fontSize?: number;
      radius?: number;
    }
  ): Phaser.GameObjects.Container {
    const bgColor = options?.bgColor ?? GameConfig.COLORS.primary;
    const hoverColor = options?.hoverColor ?? 0x5da0e9;
    const textColor = options?.textColor ?? '#ffffff';
    const fontSize = options?.fontSize ?? 24;
    const radius = options?.radius ?? 12;

    const container = scene.add.container(x, y);
    container.setSize(width, height);

    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

    const txt = scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      color: textColor,
      fontStyle: 'bold'
    });
    txt.setOrigin(0.5);

    container.add([bg, txt]);

    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    let originalScale = 1;

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(hoverColor, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
      scene.input.setDefaultCursor('pointer');
      
      const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
      if (multiplier > 0) {
        scene.tweens.add({
          targets: container,
          scale: 1.05 * multiplier + (1 - multiplier),
          duration: 150,
          ease: 'Power2'
        });
      }
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
      scene.input.setDefaultCursor('default');
      
      scene.tweens.add({
        targets: container,
        scale: originalScale,
        duration: 150,
        ease: 'Power2'
      });
    });

    container.on('pointerdown', () => {
      SoundManager.getInstance().playClick();
      const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
      if (multiplier > 0) {
        scene.tweens.add({
          targets: container,
          scale: 0.95,
          duration: 100,
          ease: 'Power2',
          onComplete: () => {
            scene.tweens.add({
              targets: container,
              scale: originalScale,
              duration: 100,
              ease: 'Power2'
            });
          }
        });
      }
      callback();
    });

    return container;
  }

  public static createPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      bgColor?: number;
      alpha?: number;
      radius?: number;
      hasBorder?: boolean;
      borderColor?: number;
      borderWidth?: number;
    }
  ): Phaser.GameObjects.Container {
    const bgColor = options?.bgColor ?? GameConfig.COLORS.panel;
    const alpha = options?.alpha ?? 0.95;
    const radius = options?.radius ?? 16;
    const hasBorder = options?.hasBorder ?? false;
    const borderColor = options?.borderColor ?? GameConfig.COLORS.primary;
    const borderWidth = options?.borderWidth ?? 2;

    const container = scene.add.container(x, y);
    container.setSize(width, height);

    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, alpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

    if (hasBorder) {
      bg.lineStyle(borderWidth, borderColor, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    }

    container.add(bg);

    return container;
  }

  public static createToggle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    initialValue: boolean,
    callback: (value: boolean) => void
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    const labelText = scene.add.text(-80, 0, label, {
      fontSize: '20px',
      color: '#ffffff'
    });
    labelText.setOrigin(0, 0.5);

    const toggleWidth = 60;
    const toggleHeight = 30;
    const knobRadius = 12;

    const track = scene.add.graphics();
    const knob = scene.add.circle(initialValue ? toggleWidth / 2 - knobRadius - 2 : -toggleWidth / 2 + knobRadius + 2, 0, knobRadius, 0xffffff);

    const updateToggle = (value: boolean) => {
      track.clear();
      track.fillStyle(value ? GameConfig.COLORS.success : 0x555555, 1);
      track.fillRoundedRect(-toggleWidth / 2, -toggleHeight / 2, toggleWidth, toggleHeight, toggleHeight / 2);
      
      scene.tweens.add({
        targets: knob,
        x: value ? toggleWidth / 2 - knobRadius - 2 : -toggleWidth / 2 + knobRadius + 2,
        duration: 200,
        ease: 'Cubic.easeOut'
      });
    };

    updateToggle(initialValue);
    container.setPosition(x, y);

    const hitArea = scene.add.rectangle(0, 0, toggleWidth + 20, toggleHeight + 10, 0xffffff, 0);
    hitArea.setInteractive();

    let currentValue = initialValue;

    hitArea.on('pointerdown', () => {
      currentValue = !currentValue;
      updateToggle(currentValue);
      SoundManager.getInstance().playClick();
      callback(currentValue);
    });

    container.add([labelText, track, knob, hitArea]);

    return container;
  }

  public static createSlider(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    options: { label: string; value: string }[],
    initialIndex: number,
    callback: (index: number, value: string) => void
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    const labelText = scene.add.text(0, -25, label, {
      fontSize: '20px',
      color: '#ffffff'
    });
    labelText.setOrigin(0.5);

    const optionWidth = 90;
    const optionHeight = 40;
    const gap = 10;
    const totalWidth = options.length * optionWidth + (options.length - 1) * gap;

    const optionsContainer: Phaser.GameObjects.Container[] = [];
    let currentIndex = initialIndex;

    const updateOptions = () => {
      optionsContainer.forEach((opt, i) => {
        const bg = opt.list[0] as Phaser.GameObjects.Graphics;
        const txt = opt.list[1] as Phaser.GameObjects.Text;
        bg.clear();
        if (i === currentIndex) {
          bg.fillStyle(GameConfig.COLORS.primary, 1);
          bg.fillRoundedRect(-optionWidth / 2, -optionHeight / 2, optionWidth, optionHeight, 8);
          txt.setColor('#ffffff');
        } else {
          bg.fillStyle(0x333344, 1);
          bg.fillRoundedRect(-optionWidth / 2, -optionHeight / 2, optionWidth, optionHeight, 8);
          txt.setColor('#aaaaaa');
        }
      });
    };

    options.forEach((opt, i) => {
      const optX = -totalWidth / 2 + i * (optionWidth + gap) + optionWidth / 2;
      const optContainer = scene.add.container(optX, 15);

      const bg = scene.add.graphics();
      bg.fillStyle(0x333344, 1);
      bg.fillRoundedRect(-optionWidth / 2, -optionHeight / 2, optionWidth, optionHeight, 8);

      const txt = scene.add.text(0, 0, opt.label, {
        fontSize: '16px',
        color: '#aaaaaa',
        fontStyle: 'bold'
      });
      txt.setOrigin(0.5);

      optContainer.add([bg, txt]);
      optContainer.setSize(optionWidth, optionHeight);
      optContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, optionWidth, optionHeight), Phaser.Geom.Rectangle.Contains);

      optContainer.on('pointerdown', () => {
        if (currentIndex !== i) {
          currentIndex = i;
          updateOptions();
          SoundManager.getInstance().playClick();
          callback(i, opt.value);
        }
      });

      optContainer.on('pointerover', () => {
        scene.input.setDefaultCursor('pointer');
      });

      optContainer.on('pointerout', () => {
        scene.input.setDefaultCursor('default');
      });

      optionsContainer.push(optContainer);
      container.add(optContainer);
    });

    container.add(labelText);
    updateOptions();

    return container;
  }

  public static createProgressBar(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    options?: {
      bgColor?: number;
      fillColor?: number;
      radius?: number;
    }
  ): Phaser.GameObjects.Container {
    const bgColor = options?.bgColor ?? 0x333344;
    const fillColor = options?.fillColor ?? GameConfig.COLORS.primary;
    const radius = options?.radius ?? height / 2;

    const container = scene.add.container(x, y);

    const bg = scene.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

    const fillWidth = Math.max(0, Math.min(progress, 1)) * (width - 4);
    const fill = scene.add.graphics();
    fill.fillStyle(fillColor, 1);
    fill.fillRoundedRect(-width / 2 + 2, -height / 2 + 2, fillWidth, height - 4, radius - 2);

    container.add([bg, fill]);

    return container;
  }

  public static animateIn(scene: Phaser.Scene, target: any, duration: number = 300): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    target.setAlpha(0);
    target.setScale(0.8);
    
    scene.tweens.add({
      targets: target,
      alpha: 1,
      scale: 1,
      duration: duration * multiplier,
      ease: 'Back.easeOut'
    });
  }

  public static animatePulse(scene: Phaser.Scene, target: any): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    scene.tweens.add({
      targets: target,
      scale: 1.05,
      duration: 500 * multiplier,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  public static shake(scene: Phaser.Scene, target: any): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    const originalX = target.x;
    scene.tweens.add({
      targets: target,
      x: originalX + 10 * multiplier,
      duration: 50,
      ease: 'Linear',
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        target.x = originalX;
      }
    });
  }

  public static flashSuccess(scene: Phaser.Scene, target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    const flash = scene.add.graphics();
    const bounds = target.getBounds();
    flash.fillStyle(GameConfig.COLORS.success, 0.4);
    flash.fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 12);
    
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400 * multiplier,
      ease: 'Linear',
      onComplete: () => flash.destroy()
    });
  }

  public static flashError(scene: Phaser.Scene, target: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    const flash = scene.add.graphics();
    const bounds = target.getBounds();
    flash.fillStyle(GameConfig.COLORS.error, 0.4);
    flash.fillRoundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 12);
    
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400 * multiplier,
      ease: 'Linear',
      onComplete: () => flash.destroy()
    });
  }
}
