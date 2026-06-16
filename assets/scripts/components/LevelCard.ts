import { _decorator, Component, Node, Label, Color, Sprite, UITransform } from 'cc';
import type { LevelConfig } from '../data/LevelConfig';
import { Difficulty } from '../data/enums/Difficulty';
import { PharmacistRole } from '../data/enums/PharmacistRole';
import { PlayerDataService } from '../services/PlayerDataService';

const { ccclass, property } = _decorator;

@ccclass('LevelCard')
export class LevelCard extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    descriptionLabel: Label | null = null;

    @property(Label)
    difficultyLabel: Label | null = null;

    @property(Label)
    timeLimitLabel: Label | null = null;

    @property(Label)
    bestScoreLabel: Label | null = null;

    @property(Sprite)
    difficultyBg: Sprite | null = null;

    @property(Sprite)
    lockMask: Sprite | null = null;

    @property(Node)
    completedBadge: Node | null = null;

    private levelConfig: LevelConfig | null = null;
    private isUnlocked: boolean = true;
    private onClickCallback: ((level: LevelConfig) => void) | null = null;

    start() {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_END, this.onClick, this);
    }

    public setData(level: LevelConfig, unlocked: boolean, callback: (level: LevelConfig) => void): void {
        this.levelConfig = level;
        this.isUnlocked = unlocked;
        this.onClickCallback = callback;
        this.refreshUI();
    }

    private refreshUI(): void {
        if (!this.levelConfig) return;

        if (this.nameLabel) {
            this.nameLabel.string = this.levelConfig.name;
        }
        if (this.descriptionLabel) {
            this.descriptionLabel.string = this.levelConfig.description;
        }
        if (this.difficultyLabel) {
            this.difficultyLabel.string = Difficulty.getDisplayName(this.levelConfig.difficulty);
        }
        if (this.timeLimitLabel) {
            const mins = Math.floor(this.levelConfig.timeLimit / 60);
            this.timeLimitLabel.string = `预计${mins}分钟`;
        }
        if (this.difficultyBg) {
            const color = Difficulty.getColor(this.levelConfig.difficulty);
            this.difficultyBg.color = new Color().fromHEX(color);
        }

        const record = PlayerDataService.instance.getLevelRecord(this.levelConfig.id);
        if (this.bestScoreLabel) {
            if (record) {
                this.bestScoreLabel.string = `最高分: ${record.bestScore}`;
            } else {
                this.bestScoreLabel.string = '未挑战';
            }
        }
        if (this.completedBadge) {
            this.completedBadge.active = record ? record.completionCount > 0 : false;
        }
        if (this.lockMask) {
            this.lockMask.active = !this.isUnlocked;
        }
    }

    private onClick(): void {
        if (!this.isUnlocked || !this.levelConfig) {
            return;
        }
        if (this.onClickCallback) {
            this.onClickCallback(this.levelConfig);
        }
    }

    public getRoleDisplay(): string {
        if (!this.levelConfig) return '';
        return this.levelConfig.岗位
            .map(r => PharmacistRole.getDisplayName(r))
            .join('、');
    }
}
