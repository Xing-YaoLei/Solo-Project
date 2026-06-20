import { _decorator, Component, Node, Label, Button, Sprite, Color, director, Toggle, Slider, ProgressBar, UITransform } from 'cc';
import { GameManager, GameEvent } from '../core/GameManager';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
import { AudioManager, SfxType } from '../core/AudioManager';
import { Settings } from '../core/GameTypes';
const { ccclass, property } = _decorator;

@ccclass('SettingsScene')
export class SettingsScene extends Component {
    @property(Node)
    settingsPanel: Node | null = null;

    @property(Toggle)
    soundToggle: Toggle | null = null;

    @property(Toggle)
    vibrationToggle: Toggle | null = null;

    @property(Slider)
    musicVolumeSlider: Slider | null = null;

    @property(Slider)
    sfxVolumeSlider: Slider | null = null;

    @property(Label)
    musicVolumeLabel: Label | null = null;

    @property(Label)
    sfxVolumeLabel: Label | null = null;

    @property(Node)
    animationGroup: Node | null = null;

    @property(Toggle)
    animationOffToggle: Toggle | null = null;

    @property(Toggle)
    animationLowToggle: Toggle | null = null;

    @property(Toggle)
    animationMediumToggle: Toggle | null = null;

    @property(Toggle)
    animationHighToggle: Toggle | null = null;

    @property(Toggle)
    tooltipsToggle: Toggle | null = null;

    @property(Toggle)
    keyboardToggle: Toggle | null = null;

    @property(Toggle)
    autoCheckToggle: Toggle | null = null;

    @property(Button)
    backButton: Button | null = null;

    @property(Button)
    resetProgressButton: Button | null = null;

    @property(Node)
    confirmDialog: Node | null = null;

    @property(Button)
    confirmYesButton: Button | null = null;

    @property(Button)
    confirmNoButton: Button | null = null;

    private currentSettings: Settings = GameManager.instance.settings;

    onLoad() {
        this.loadSettings();
        this.setupListeners();
    }

    private loadSettings(): void {
        const settings = this.currentSettings;

        if (this.soundToggle) {
            this.soundToggle.isChecked = settings.soundEnabled;
        }
        if (this.vibrationToggle) {
            this.vibrationToggle.isChecked = settings.vibrationEnabled;
        }
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.progress = settings.musicVolume;
        }
        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.progress = settings.sfxVolume;
        }
        if (this.musicVolumeLabel) {
            this.musicVolumeLabel.string = `${Math.round(settings.musicVolume * 100)}%`;
        }
        if (this.sfxVolumeLabel) {
            this.sfxVolumeLabel.string = `${Math.round(settings.sfxVolume * 100)}%`;
        }

        this.setAnimationToggle(settings.animationIntensity);

        if (this.tooltipsToggle) {
            this.tooltipsToggle.isChecked = settings.showTooltips;
        }
        if (this.keyboardToggle) {
            this.keyboardToggle.isChecked = settings.keyboardShortcuts;
        }
        if (this.autoCheckToggle) {
            this.autoCheckToggle.isChecked = settings.autoCheckAnswers;
        }

        if (this.confirmDialog) {
            this.confirmDialog.active = false;
        }
    }

    private setupListeners(): void {
        this.soundToggle?.node.on(Toggle.EventType.TOGGLE, this.onSoundToggle, this);
        this.vibrationToggle?.node.on(Toggle.EventType.TOGGLE, this.onVibrationToggle, this);

        this.musicVolumeSlider?.node.on('slide', this.onMusicVolumeChange, this);
        this.sfxVolumeSlider?.node.on('slide', this.onSfxVolumeChange, this);

        this.animationOffToggle?.node.on(Toggle.EventType.TOGGLE, () => this.onAnimationToggle('off'), this);
        this.animationLowToggle?.node.on(Toggle.EventType.TOGGLE, () => this.onAnimationToggle('low'), this);
        this.animationMediumToggle?.node.on(Toggle.EventType.TOGGLE, () => this.onAnimationToggle('medium'), this);
        this.animationHighToggle?.node.on(Toggle.EventType.TOGGLE, () => this.onAnimationToggle('high'), this);

        this.tooltipsToggle?.node.on(Toggle.EventType.TOGGLE, this.onTooltipsToggle, this);
        this.keyboardToggle?.node.on(Toggle.EventType.TOGGLE, this.onKeyboardToggle, this);
        this.autoCheckToggle?.node.on(Toggle.EventType.TOGGLE, this.onAutoCheckToggle, this);

        this.backButton?.node.on(Button.EventType.CLICK, this.onBack, this);
        this.resetProgressButton?.node.on(Button.EventType.CLICK, this.onResetProgress, this);

        this.confirmYesButton?.node.on(Button.EventType.CLICK, this.onConfirmReset, this);
        this.confirmNoButton?.node.on(Button.EventType.CLICK, this.onCancelReset, this);
    }

    private onSoundToggle(toggle: Toggle): void {
        this.currentSettings.soundEnabled = toggle.isChecked;
        GameManager.instance.updateSettings({ soundEnabled: toggle.isChecked });
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onVibrationToggle(toggle: Toggle): void {
        this.currentSettings.vibrationEnabled = toggle.isChecked;
        GameManager.instance.updateSettings({ vibrationEnabled: toggle.isChecked });
        if (toggle.isChecked) {
            FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        }
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onMusicVolumeChange(slider: Slider): void {
        const volume = slider.progress;
        this.currentSettings.musicVolume = volume;
        GameManager.instance.updateSettings({ musicVolume: volume });

        if (this.musicVolumeLabel) {
            this.musicVolumeLabel.string = `${Math.round(volume * 100)}%`;
        }
    }

    private onSfxVolumeChange(slider: Slider): void {
        const volume = slider.progress;
        this.currentSettings.sfxVolume = volume;
        GameManager.instance.updateSettings({ sfxVolume: volume });

        if (this.sfxVolumeLabel) {
            this.sfxVolumeLabel.string = `${Math.round(volume * 100)}%`;
        }

        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onAnimationToggle(intensity: string): void {
        if (this.currentSettings.animationIntensity === intensity) {
            this.setAnimationToggle(intensity);
            return;
        }

        this.currentSettings.animationIntensity = intensity as any;
        GameManager.instance.updateSettings({ animationIntensity: intensity as any });
        this.setAnimationToggle(intensity);

        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
    }

    private setAnimationToggle(intensity: string): void {
        if (this.animationOffToggle) this.animationOffToggle.isChecked = intensity === 'off';
        if (this.animationLowToggle) this.animationLowToggle.isChecked = intensity === 'low';
        if (this.animationMediumToggle) this.animationMediumToggle.isChecked = intensity === 'medium';
        if (this.animationHighToggle) this.animationHighToggle.isChecked = intensity === 'high';
    }

    private onTooltipsToggle(toggle: Toggle): void {
        this.currentSettings.showTooltips = toggle.isChecked;
        GameManager.instance.updateSettings({ showTooltips: toggle.isChecked });
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onKeyboardToggle(toggle: Toggle): void {
        this.currentSettings.keyboardShortcuts = toggle.isChecked;
        GameManager.instance.updateSettings({ keyboardShortcuts: toggle.isChecked });
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onAutoCheckToggle(toggle: Toggle): void {
        this.currentSettings.autoCheckAnswers = toggle.isChecked;
        GameManager.instance.updateSettings({ autoCheckAnswers: toggle.isChecked });
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private onBack(): void {
        AudioManager.instance.playSfx(SfxType.CLICK);
        FeedbackManager.instance.vibrate(VibrationType.LIGHT);
        director.loadScene('main-menu');
    }

    private onResetProgress(): void {
        if (this.confirmDialog) {
            this.confirmDialog.active = true;
        }
        AudioManager.instance.playSfx(SfxType.WARNING);
        FeedbackManager.instance.vibrate(VibrationType.WARNING);
    }

    private onConfirmReset(): void {
        GameManager.instance.resetAllProgress();
        if (this.confirmDialog) {
            this.confirmDialog.active = false;
        }
        AudioManager.instance.playSfx(SfxType.SUCCESS);
        FeedbackManager.instance.vibrate(VibrationType.SUCCESS);

        this.showToast('进度已重置');
    }

    private onCancelReset(): void {
        if (this.confirmDialog) {
            this.confirmDialog.active = false;
        }
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    private showToast(message: string): void {
        if (!this.settingsPanel) return;

        let toastNode = this.settingsPanel.getChildByName('Toast');
        if (!toastNode) {
            toastNode = new Node('Toast');
            toastNode.addComponent(UITransform).setContentSize(300, 60);
            const sprite = toastNode.addComponent(Sprite);
            sprite.color = new Color(0, 0, 0, 200);

            const labelNode = new Node('Label');
            labelNode.addComponent(UITransform).setContentSize(280, 40);
            const label = labelNode.addComponent(Label);
            label.string = message;
            label.fontSize = 18;
            label.color = new Color(255, 255, 255, 255);
            toastNode.addChild(labelNode);

            this.settingsPanel.addChild(toastNode);
        }

        toastNode.setPosition(0, -200);
        toastNode.active = true;
        const label = toastNode.getChildByName('Label')?.getComponent(Label);
        if (label) label.string = message;

        this.scheduleOnce(() => {
            if (toastNode && toastNode.isValid) {
                toastNode.active = false;
            }
        }, 2);
    }
}
