import { _decorator, Component, Node, Button, Toggle, Slider, Label, Vec3, tween, UIOpacity } from 'cc';
import { SettingsManager } from '../config/SettingsManager';
import { EventBus, GameEvents } from '../core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('SettingsPanel')
export class SettingsPanel extends Component {
  @property(Node)
  content: Node | null = null;

  @property(Toggle)
  soundToggle: Toggle | null = null;

  @property(Toggle)
  vibrationToggle: Toggle | null = null;

  @property(Slider)
  animationSlider: Slider | null = null;

  @property(Slider)
  musicVolumeSlider: Slider | null = null;

  @property(Slider)
  sfxVolumeSlider: Slider | null = null;

  @property(Label)
  animationValueLabel: Label | null = null;

  @property(Label)
  musicValueLabel: Label | null = null;

  @property(Label)
  sfxValueLabel: Label | null = null;

  @property(Button)
  closeButton: Button | null = null;

  @property(Button)
  resetButton: Button | null = null;

  onLoad(): void {
    if (this.content) {
      this.content.active = false;
    }

    this.loadSettings();
    this.setupEventListeners();
  }

  private loadSettings(): void {
    const settings = SettingsManager.getInstance();

    if (this.soundToggle) {
      this.soundToggle.isChecked = settings.soundEnabled;
    }

    if (this.vibrationToggle) {
      this.vibrationToggle.isChecked = settings.vibrationEnabled;
    }

    if (this.animationSlider) {
      this.animationSlider.progress = settings.animationIntensity;
      this.updateAnimationLabel(settings.animationIntensity);
    }

    if (this.musicVolumeSlider) {
      this.musicVolumeSlider.progress = settings.musicVolume;
      this.updateMusicLabel(settings.musicVolume);
    }

    if (this.sfxVolumeSlider) {
      this.sfxVolumeSlider.progress = settings.sfxVolume;
      this.updateSfxLabel(settings.sfxVolume);
    }
  }

  private setupEventListeners(): void {
    if (this.soundToggle) {
      this.soundToggle.node.on('toggle', this.onSoundToggle, this);
    }

    if (this.vibrationToggle) {
      this.vibrationToggle.node.on('toggle', this.onVibrationToggle, this);
    }

    if (this.animationSlider) {
      this.animationSlider.node.on('slide', this.onAnimationSlider, this);
    }

    if (this.musicVolumeSlider) {
      this.musicVolumeSlider.node.on('slide', this.onMusicVolumeSlider, this);
    }

    if (this.sfxVolumeSlider) {
      this.sfxVolumeSlider.node.on('slide', this.onSfxVolumeSlider, this);
    }

    if (this.closeButton) {
      this.closeButton.node.on(Button.EventType.CLICK, this.hide, this);
    }

    if (this.resetButton) {
      this.resetButton.node.on(Button.EventType.CLICK, this.onReset, this);
    }

    EventBus.instance.on(GameEvents.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
  }

  show(): void {
    if (!this.content) return;

    const intensity = SettingsManager.getInstance().animationIntensity;
    this.content.active = true;

    if (intensity > 0) {
      const opacity = this.content.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = 0;
      }
      this.content.setScale(0.9, 0.9, 1);

      tween(this.content)
        .parallel(
          tween().to(0.2 * intensity, { scale: new Vec3(1, 1, 1) }),
          tween().call(() => {
            if (opacity) {
              tween(opacity)
                .to(0.2 * intensity, { opacity: 255 })
                .start();
            }
          })
        )
        .start();
    }
  }

  hide(): void {
    if (!this.content) return;

    const intensity = SettingsManager.getInstance().animationIntensity;

    if (intensity > 0) {
      const opacity = this.content.getComponent(UIOpacity);
      tween(this.content)
        .to(0.15 * intensity, { scale: new Vec3(0.9, 0.9, 1) })
        .call(() => {
          this.content!.active = false;
        })
        .start();

      if (opacity) {
        tween(opacity)
          .to(0.15 * intensity, { opacity: 0 })
          .start();
      }
    } else {
      this.content.active = false;
    }
  }

  private onSoundToggle(toggle: Toggle): void {
    SettingsManager.getInstance().update('soundEnabled', toggle.isChecked);
  }

  private onVibrationToggle(toggle: Toggle): void {
    SettingsManager.getInstance().update('vibrationEnabled', toggle.isChecked);
    
    if (toggle.isChecked) {
      SettingsManager.getInstance().vibrate(50);
    }
  }

  private onAnimationSlider(slider: Slider): void {
    SettingsManager.getInstance().setAnimationIntensity(slider.progress);
    this.updateAnimationLabel(slider.progress);
  }

  private onMusicVolumeSlider(slider: Slider): void {
    SettingsManager.getInstance().setMusicVolume(slider.progress);
    this.updateMusicLabel(slider.progress);
  }

  private onSfxVolumeSlider(slider: Slider): void {
    SettingsManager.getInstance().setSfxVolume(slider.progress);
    this.updateSfxLabel(slider.progress);
  }

  private onReset(): void {
    SettingsManager.getInstance().reset();
    this.loadSettings();
  }

  private onSettingsChanged(key: string | null, value: unknown): void {
    if (key === null) {
      this.loadSettings();
    }
  }

  private updateAnimationLabel(value: number): void {
    if (this.animationValueLabel) {
      this.animationValueLabel.string = `${Math.round(value * 100)}%`;
    }
  }

  private updateMusicLabel(value: number): void {
    if (this.musicValueLabel) {
      this.musicValueLabel.string = `${Math.round(value * 100)}%`;
    }
  }

  private updateSfxLabel(value: number): void {
    if (this.sfxValueLabel) {
      this.sfxValueLabel.string = `${Math.round(value * 100)}%`;
    }
  }

  onDestroy(): void {
    EventBus.instance.off(GameEvents.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
    
    if (this.soundToggle) {
      this.soundToggle.node.off('toggle', this.onSoundToggle, this);
    }

    if (this.vibrationToggle) {
      this.vibrationToggle.node.off('toggle', this.onVibrationToggle, this);
    }

    if (this.animationSlider) {
      this.animationSlider.node.off('slide', this.onAnimationSlider, this);
    }

    if (this.musicVolumeSlider) {
      this.musicVolumeSlider.node.off('slide', this.onMusicVolumeSlider, this);
    }

    if (this.sfxVolumeSlider) {
      this.sfxVolumeSlider.node.off('slide', this.onSfxVolumeSlider, this);
    }
  }
}
