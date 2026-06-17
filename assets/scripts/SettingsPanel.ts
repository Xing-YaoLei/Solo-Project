import { _decorator, Component, Node, Label, Button, Toggle, Slider, Sprite, Color } from 'cc';
import { GameManager, GameSettings } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('SettingsPanel')
export class SettingsPanel extends Component {
    @property(Node)
    panelNode: Node | null = null;

    @property(Toggle)
    soundToggle: Toggle | null = null;

    @property(Toggle)
    vibrationToggle: Toggle | null = null;

    @property(Slider)
    animationSlider: Slider | null = null;

    @property(Label)
    animationValueLabel: Label | null = null;

    @property(Button)
    closeButton: Button | null = null;

    @property(Button)
    resetButton: Button | null = null;

    onLoad() {
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners(): void {
        if (this.soundToggle) {
            this.soundToggle.node.on(Toggle.EventType.TOGGLE, this.onSoundToggle, this);
        }
        if (this.vibrationToggle) {
            this.vibrationToggle.node.on(Toggle.EventType.TOGGLE, this.onVibrationToggle, this);
        }
        if (this.animationSlider) {
            this.animationSlider.node.on('slide', this.onAnimationSlide, this);
        }
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onClose, this);
        }
        if (this.resetButton) {
            this.resetButton.node.on(Button.EventType.CLICK, this.onReset, this);
        }
    }

    loadSettings(): void {
        const settings = GameManager.instance.settings;

        if (this.soundToggle) {
            this.soundToggle.isChecked = settings.soundEnabled;
            this.updateToggleVisual(this.soundToggle, settings.soundEnabled);
        }
        if (this.vibrationToggle) {
            this.vibrationToggle.isChecked = settings.vibrationEnabled;
            this.updateToggleVisual(this.vibrationToggle, settings.vibrationEnabled);
        }
        if (this.animationSlider) {
            this.animationSlider.progress = settings.animationIntensity;
            this.updateAnimationLabel(settings.animationIntensity);
        }
    }

    updateToggleVisual(toggle: Toggle, isOn: boolean): void {
        const sprite = toggle.getComponent(Sprite);
        const bgSprite = toggle.node.getComponent(Sprite);
        if (bgSprite) {
            bgSprite.color = isOn ? new Color(70, 150, 255, 255) : new Color(200, 200, 200, 255);
        }
    }

    onSoundToggle(toggle: Toggle): void {
        const enabled = toggle.isChecked;
        GameManager.instance.updateSettings({ soundEnabled: enabled });
        this.updateToggleVisual(toggle, enabled);
        if (enabled) {
            GameManager.instance.playSound('click');
        }
    }

    onVibrationToggle(toggle: Toggle): void {
        const enabled = toggle.isChecked;
        GameManager.instance.updateSettings({ vibrationEnabled: enabled });
        this.updateToggleVisual(toggle, enabled);
        if (enabled) {
            GameManager.instance.vibrate(50);
        }
    }

    onAnimationSlide(slider: Slider): void {
        const intensity = slider.progress;
        GameManager.instance.updateSettings({ animationIntensity: intensity });
        this.updateAnimationLabel(intensity);
    }

    updateAnimationLabel(intensity: number): void {
        if (this.animationValueLabel) {
            const level = intensity < 0.33 ? '低' : intensity < 0.66 ? '中' : '高';
            this.animationValueLabel.string = level;
        }
    }

    show(): void {
        if (this.panelNode) {
            this.panelNode.active = true;
        }
    }

    hide(): void {
        if (this.panelNode) {
            this.panelNode.active = false;
        }
    }

    onClose(): void {
        GameManager.instance.playSound('click');
        this.hide();
    }

    onReset(): void {
        GameManager.instance.playSound('click');
        if (confirm('确定要重置所有游戏数据吗？这将清除所有关卡进度。')) {
            GameManager.instance.resetAllData();
            this.loadSettings();
        }
    }
}
