import Phaser from 'phaser';
import { UI_STYLES } from './styles';

export abstract class BaseComponent<T extends BaseComponent<T>> extends Phaser.GameObjects.Container {
  protected isInteractive = false;
  protected isSelected = false;
  protected isDisabled = false;
  protected isHovered = false;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    super(scene, x, y);
    scene.add.existing(this);
  }

  protected abstract initialize(): void;

  public setInteractive(enabled: boolean = true): this {
    this.isInteractive = enabled;
    return this;
  }

  public setSelected(selected: boolean = true): this {
    this.isSelected = selected;
    this.onSelectChange(selected);
    return this;
  }

  public setDisabled(disabled: boolean = true): this {
    this.isDisabled = disabled;
    this.onDisableChange(disabled);
    return this;
  }

  protected onSelectChange(_selected: boolean): void {}

  protected onDisableChange(_disabled: boolean): void {}

  protected setHover(hovered: boolean): void {
    if (this.isHovered === hovered || this.isDisabled) return;
    this.isHovered = hovered;
    this.onHoverChange(hovered);
  }

  protected onHoverChange(_hovered: boolean): void {}

  public setPosition(x: number, y: number): this {
    super.setPosition(x, y);
    return this;
  }

  public setVisible(visible: boolean): this {
    super.setVisible(visible);
    return this;
  }

  public setAlpha(alpha: number): this {
    super.setAlpha(alpha);
    return this;
  }

  public setScale(scale: number): this {
    super.setScale(scale);
    return this;
  }

  public setDepth(depth: number): this {
    super.setDepth(depth);
    return this;
  }

  public setOrigin(_originX: number, _originY?: number): this {
    return this;
  }

  public show(): this {
    return this.setVisible(true);
  }

  public hide(): this {
    return this.setVisible(false);
  }

  public fadeIn(duration: number = UI_STYLES.animation.duration.normal): this {
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration,
      ease: UI_STYLES.animation.ease,
    });
    return this;
  }

  public fadeOut(duration: number = UI_STYLES.animation.duration.normal): this {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration,
      ease: UI_STYLES.animation.ease,
    });
    return this;
  }

  public scaleIn(duration: number = UI_STYLES.animation.duration.normal): this {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration,
      ease: 'Back.easeOut',
    });
    return this;
  }

  public scaleOut(duration: number = UI_STYLES.animation.duration.normal, onComplete?: () => void): this {
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      duration,
      ease: 'Back.easeIn',
      onComplete,
    });
    return this;
  }

  public destroy(fromScene?: boolean): void {
    this.removeAllListeners();
    super.destroy(fromScene);
  }
}
