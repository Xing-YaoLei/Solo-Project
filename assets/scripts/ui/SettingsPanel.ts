import { _decorator, Component, Node, Label, Slider, Toggle, UITransform, Sprite, Color, Vec3 } from "cc";
import { GameManager } from "../managers/GameManager";
import { GameSettings } from "../models/Config";

const { ccclass } = _decorator;

@ccclass("SettingsPanel")
export class SettingsPanel extends Component {
    private settings: GameSettings | null = null;
    private onClosed: (() => void) | null = null;

    public init(): void {
        const gm = GameManager.instance;
        if (gm) {
            this.settings = { ...gm.getSettings() };
        } else {
            this.settings = {
                soundEnabled: true,
                vibrationEnabled: true,
                animationIntensity: 1.0,
                autoPauseEnabled: true,
                tutorialCompleted: false,
                language: "zh"
            };
        }
        this.updateVisual();
    }

    private updateVisual(): void {
        if (!this.settings) return;

        const soundToggle = this.node.getChildByName("soundToggle");
        if (soundToggle) {
            const toggle = soundToggle.getComponent(Toggle);
            if (toggle) {
                toggle.isChecked = this.settings.soundEnabled;
            }
        }

        const vibrationToggle = this.node.getChildByName("vibrationToggle");
        if (vibrationToggle) {
            const toggle = vibrationToggle.getComponent(Toggle);
            if (toggle) {
                toggle.isChecked = this.settings.vibrationEnabled;
            }
        }

        const animSlider = this.node.getChildByName("animSlider");
        if (animSlider) {
            const slider = animSlider.getComponent(Slider);
            if (slider) {
                slider.progress = this.settings.animationIntensity;
            }
        }

        const animLabel = this.node.getChildByName("animLabel");
        if (animLabel) {
            const label = animLabel.getComponent(Label);
            if (label) {
                label.string = `动画强度: ${Math.round(this.settings.animationIntensity * 100)}%`;
            }
        }

        const autoPauseToggle = this.node.getChildByName("autoPauseToggle");
        if (autoPauseToggle) {
            const toggle = autoPauseToggle.getComponent(Toggle);
            if (toggle) {
                toggle.isChecked = this.settings.autoPauseEnabled;
            }
        }
    }

    public onSoundToggleChanged(isChecked: boolean): void {
        if (this.settings) {
            this.settings.soundEnabled = isChecked;
        }
    }

    public onVibrationToggleChanged(isChecked: boolean): void {
        if (this.settings) {
            this.settings.vibrationEnabled = isChecked;
        }
    }

    public onAnimSliderChanged(progress: number): void {
        if (this.settings) {
            this.settings.animationIntensity = progress;
            const animLabel = this.node.getChildByName("animLabel");
            if (animLabel) {
                const label = animLabel.getComponent(Label);
                if (label) {
                    label.string = `动画强度: ${Math.round(progress * 100)}%`;
                }
            }
        }
    }

    public onAutoPauseToggleChanged(isChecked: boolean): void {
        if (this.settings) {
            this.settings.autoPauseEnabled = isChecked;
        }
    }

    public onSaveClicked(): void {
        if (!this.settings) return;

        const gm = GameManager.instance;
        if (gm) {
            gm.updateSettings(this.settings);
        }

        if (this.onClosed) {
            this.onClosed();
        }
    }

    public onCancelClicked(): void {
        if (this.onClosed) {
            this.onClosed();
        }
    }

    public setOnClosed(cb: () => void): void {
        this.onClosed = cb;
    }
}
