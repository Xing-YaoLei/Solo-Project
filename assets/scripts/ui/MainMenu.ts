import { _decorator, Component, Node, Button, Label, Prefab, instantiate, Vec3, ScrollView, Color, UITransform, director } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { LevelManager } from '../game/LevelManager';
import { LevelConfig } from '../models/Level';
const { ccclass, property } = _decorator;

@ccclass('LevelSelectItem')
export class LevelSelectItem extends Component {
    @property(Label)
    public nameLabel: Label | null = null;

    @property(Label)
    public descLabel: Label | null = null;

    @property(Label)
    public difficultyLabel: Label | null = null;

    @property(Label)
    public highScoreLabel: Label | null = null;

    @property(Node)
    public lockedMask: Node | null = null;

    @property(Button)
    public selectBtn: Button | null = null;

    private _levelData: LevelConfig | null = null;
    private _onSelect: ((levelId: string) => void) | null = null;

    setData(data: LevelConfig, isUnlocked: boolean, highScore: number, onSelect: (levelId: string) => void) {
        this._levelData = data;
        this._onSelect = onSelect;

        if (this.nameLabel) this.nameLabel.string = data.name;
        if (this.descLabel) this.descLabel.string = data.description;
        if (this.highScoreLabel) this.highScoreLabel.string = highScore > 0 ? `最高分: ${highScore}` : '未通关';

        this.updateDifficultyDisplay(data.difficulty);

        if (this.lockedMask) {
            this.lockedMask.active = !isUnlocked;
        }

        if (this.selectBtn) {
            this.selectBtn.interactable = isUnlocked;
        }
    }

    private updateDifficultyDisplay(difficulty: number): void {
        if (!this.difficultyLabel) return;

        const stars = '★'.repeat(difficulty) + '☆'.repeat(Math.max(0, 4 - difficulty));
        this.difficultyLabel.string = stars;

        const colors: Record<number, Color> = {
            1: new Color(100, 200, 100),
            2: new Color(80, 150, 255),
            3: new Color(200, 100, 200),
            4: new Color(255, 100, 100)
        };
        this.difficultyLabel.color = colors[difficulty] || Color.WHITE;
    }

    onLoad() {
        if (this.selectBtn) {
            this.selectBtn.node.on(Button.EventType.CLICK, this.onClick, this);
        }
    }

    onDestroy() {
        if (this.selectBtn) {
            this.selectBtn.node.off(Button.EventType.CLICK, this.onClick, this);
        }
    }

    private onClick(): void {
        if (this._levelData && this._onSelect) {
            this._onSelect(this._levelData.id);
        }
    }
}

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Node)
    public levelsContainer: Node | null = null;

    @property(ScrollView)
    public levelsScroll: ScrollView | null = null;

    @property(Prefab)
    public levelItemPrefab: Prefab | null = null;

    @property(Button)
    public startBtn: Node | null = null;

    @property(Button)
    public achievementsBtn: Button | null = null;

    @property(Button)
    public settingsBtn: Button | null = null;

    @property(Node)
    public levelSelectPanel: Node | null = null;

    @property(Node)
    public achievementsPanel: Node | null = null;

    @property(Button)
    public backToMenuBtn: Button | null = null;

    @property
    public itemGap: number = 20;

    @property
    public itemHeight: number = 140;

    onLoad() {
        if (this.startBtn) {
            this.startBtn.on(Node.EventType.TOUCH_END, this.showLevelSelect, this);
        }
        if (this.achievementsBtn) {
            this.achievementsBtn.node.on(Button.EventType.CLICK, this.showAchievements, this);
        }
        if (this.backToMenuBtn) {
            this.backToMenuBtn.node.on(Button.EventType.CLICK, this.backToMenu, this);
        }

        if (this.levelSelectPanel) this.levelSelectPanel.active = false;
        if (this.achievementsPanel) this.achievementsPanel.active = false;
    }

    onDestroy() {
        if (this.startBtn) {
            this.startBtn.off(Node.EventType.TOUCH_END, this.showLevelSelect, this);
        }
        if (this.achievementsBtn) {
            this.achievementsBtn.node.off(Button.EventType.CLICK, this.showAchievements, this);
        }
        if (this.backToMenuBtn) {
            this.backToMenuBtn.node.off(Button.EventType.CLICK, this.backToMenu, this);
        }
    }

    private showLevelSelect(): void {
        if (this.levelSelectPanel) this.levelSelectPanel.active = true;
        this.buildLevelList();
    }

    private buildLevelList(): void {
        if (!this.levelsContainer || !this.levelItemPrefab) return;

        this.levelsContainer.removeAllChildren();

        const levels = LevelManager.getInstance().getAvailableLevels();
        let yOffset = -this.itemHeight / 2 - this.itemGap;

        const uiTransform = this.levelsContainer.getComponent(UITransform);
        if (uiTransform) {
            const totalHeight = levels.length * (this.itemHeight + this.itemGap) + this.itemGap;
            uiTransform.setContentSize(uiTransform.contentSize.width, totalHeight);
        }

        for (const level of levels) {
            const isUnlocked = LevelManager.getInstance().isLevelUnlocked(level.id);
            const highScore = LevelManager.getInstance().getHighScore(level.id);

            const itemNode = instantiate(this.levelItemPrefab);
            itemNode.setParent(this.levelsContainer);
            itemNode.setPosition(new Vec3(0, yOffset, 0));

            const item = itemNode.getComponent(LevelSelectItem);
            if (item) {
                item.setData(level, isUnlocked, highScore, (levelId) => this.onLevelSelected(levelId));
            }

            yOffset -= this.itemHeight + this.itemGap;
        }
    }

    private onLevelSelected(levelId: string): void {
        director.loadScene('GameScene', () => {
            EventManager.getInstance().emit('start_level', levelId);
        });
    }

    private showAchievements(): void {
        if (this.achievementsPanel) this.achievementsPanel.active = true;
    }

    private backToMenu(): void {
        if (this.levelSelectPanel) this.levelSelectPanel.active = false;
        if (this.achievementsPanel) this.achievementsPanel.active = false;
    }
}
