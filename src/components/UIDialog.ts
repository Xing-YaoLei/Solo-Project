import { COLORS, DialogConfig } from '../types';
import { UIButton } from './UIButton';

export class UIDialog extends Phaser.GameObjects.Container {
  private overlay: Phaser.GameObjects.Rectangle;
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private contentText: Phaser.GameObjects.Text;
  private buttonContainer: Phaser.GameObjects.Container;
  private buttons: UIButton[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    this.setSize(width, height);

    this.overlay = scene.add.rectangle(0, 0, scene.game.config.width as number, scene.game.config.height as number, 0x000000, 0.7)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setInteractive();

    this.background = scene.add.rectangle(0, 0, width, height, COLORS.surface)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(3, COLORS.primary)
      .setScrollFactor(0);

    this.titleText = scene.add.text(0, -height / 2 + 40, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    this.contentText = scene.add.text(0, 0, '', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5, 0.5);

    this.buttonContainer = scene.add.container(0, height / 2 - 60);

    this.add([this.overlay, this.background, this.titleText, this.contentText, this.buttonContainer]);
    this.setVisible(false);
    this.setActive(false);

    scene.add.existing(this);
  }

  show(config: DialogConfig): this {
    this.titleText.setText(config.title);
    this.contentText.setText(config.content);

    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
    this.buttonContainer.removeAll(true);

    const buttonWidth = 120;
    const buttonHeight = 50;
    const buttonSpacing = 20;
    const totalWidth = config.buttons.length * buttonWidth + (config.buttons.length - 1) * buttonSpacing;
    let startX = -totalWidth / 2 + buttonWidth / 2;

    config.buttons.forEach((btnConfig, index) => {
      const button = new UIButton(
        this.scene,
        startX + index * (buttonWidth + buttonSpacing),
        0,
        buttonWidth,
        buttonHeight,
        btnConfig.text,
        16,
        btnConfig.isPrimary ? COLORS.primary : COLORS.surfaceLight
      ).setOnClick(() => {
          btnConfig.onClick();
          this.hide();
        });

      this.buttons.push(button);
      this.buttonContainer.add(button);
    });

    this.setVisible(true);
    this.setActive(true);

    this.alpha = 0;
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 200,
      ease: 'Power2.out'
    });

    return this;
  }

  hide(): this {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 150,
      ease: 'Power2.in',
      onComplete: () => {
        this.setVisible(false);
        this.setActive(false);
      }
    });
    return this;
  }

  setTitle(title: string): this {
    this.titleText.setText(title);
    return this;
  }

  setContent(content: string): this {
    this.contentText.setText(content);
    return this;
  }
}
