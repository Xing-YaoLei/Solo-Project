import { _decorator, Label, Node, Button, Sprite, Color, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { LevelManager } from '../managers/LevelManager';
import { DataManager } from '../managers/DataManager';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('LevelSelectPanel')
export class LevelSelectPanel extends UIBase {
    @property(Node)
    levelList: Node | null = null;

    @property(Node)
    levelItemTemplate: Node | null = null;

    @property(Node)
    backButton: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    private _levelNodes: Node[] = [];

    onInit(): void {
        if (this.levelItemTemplate) {
            this.levelItemTemplate.active = false;
        }
    }

    onStart(): void {
        this.on(GameEvents.UI_SHOW_LEVEL_SELECT, this.onShowPanel.bind(this));
        this.on(GameEvents.LEVEL_UNLOCKED, this.onLevelUnlocked.bind(this));

        this.registerInput('cancel', this.onBackClicked.bind(this));
    }

    private onShowPanel(): void {
        this.show();
        this.refreshLevels();
    }

    private onLevelUnlocked(levelId: string): void {
        this.refreshLevels();
    }

    private refreshLevels(): void {
        if (!this.levelList || !this.levelItemTemplate) return;

        for (const node of this._levelNodes) {
            node.off(Node.EventType.TOUCH_END);
            node.destroy();
        }
        this._levelNodes = [];

        const levels = DataManager.instance.getAllLevels();
        const cols = 3;

        levels.forEach((level, index) => {
            const levelNode = instantiate(this.levelItemTemplate!);
            levelNode.active = true;

            const col = index % cols;
            const row = Math.floor(index / cols);
            levelNode.setPosition((col - 1) * 200, -row * 180, 0);

            const unlocked = LevelManager.instance.isLevelUnlocked(level.id);
            const progress = LevelManager.instance.getLevelProgress(level.id);

            const nameLabel = levelNode.getChildByName('nameLabel')?.getComponent(Label);
            const descLabel = levelNode.getChildByName('descLabel')?.getComponent(Label);
            const lockSprite = levelNode.getChildByName('lockSprite')?.getComponent(Sprite);
            const starsContainer = levelNode.getChildByName('starsContainer');

            if (nameLabel) nameLabel.string = level.name;
            if (descLabel) descLabel.string = level.description;
            if (lockSprite) lockSprite.node.active = !unlocked;

            if (starsContainer && progress) {
                for (let i = 0; i < 3; i++) {
                    const starNode = starsContainer.getChildByName(`star_${i}`);
                    if (starNode) {
                        const star = starNode.getComponent(Sprite);
                        if (star) {
                            star.color = i < (progress.stars || 0)
                                ? new Color(255, 200, 0, 255)
                                : new Color(200, 200, 200, 255);
                        }
                    }
                }
            }

            if (unlocked) {
                levelNode.on(Node.EventType.TOUCH_END, () => {
                    this.onLevelTapped(level.id);
                }, this);
            }

            this.levelList!.addChild(levelNode);
            this._levelNodes.push(levelNode);
        });
    }

    private onLevelTapped(levelId: string): void {
        if (!LevelManager.instance.isLevelUnlocked(levelId)) return;

        AudioManager.instance.playClick();
        if (GameManager.instance.startLevel(levelId)) {
            this.hide();
        }
    }

    public onBackClicked(): void {
        AudioManager.instance.playClick();
        this.hide();
        this.emit(GameEvents.UI_SHOW_MENU);
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
