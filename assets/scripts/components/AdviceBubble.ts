import { _decorator, Component, Node, Label, Color, Sprite } from 'cc';
import type { EvaluatedAdvice } from '../services/PharmacistAdviceService';
import { PharmacistAdviceService } from '../services/PharmacistAdviceService';

const { ccclass, property } = _decorator;

@ccclass('AdviceBubble')
export class AdviceBubble extends Component {
    @property(Label)
    contentLabel: Label | null = null;

    @property(Sprite)
    iconSprite: Sprite | null = null;

    @property(Sprite)
    backgroundSprite: Sprite | null = null;

    public setData(advice: EvaluatedAdvice): void {
        const color = PharmacistAdviceService.instance.getAdviceTypeColor(advice.type);
        const icon = PharmacistAdviceService.instance.getAdviceTypeIcon(advice.type);

        if (this.contentLabel) {
            this.contentLabel.string = `${icon} ${advice.content}`;
            this.contentLabel.color = new Color().fromHEX(color);
        }

        if (this.backgroundSprite) {
            const bgColor = new Color().fromHEX(color);
            bgColor.a = 30;
            this.backgroundSprite.color = bgColor;
        }
    }
}
