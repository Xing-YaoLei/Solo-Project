import { _decorator, Component, Node, Button, Label, Sprite, Color, ScrollView, instantiate, Prefab, tween, Vec3 } from 'cc';
import { GameMode, PostType, DifficultyLevel } from '../models/GameEnums';
import type { LevelData } from '../models';
import { getLevelsByModeAndPost } from '../data/LevelDataConfig';
import { GameSaveManager } from '../data/GameSaveManager';
import { GameManager } from '../core/GameManager';
import { SceneManager } from '../utils/SceneManager';
const { ccclass, property } = _decorator;

@ccclass('LevelItem')
export class LevelItem extends Component {
    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    descLabel: Label | null = null;

    @property(Label)
    difficultyLabel: Label | null = null;

    @property(Label)
    bestScoreLabel: Label | null = null;

    @property(Node)
    starsContainer: Node | null = null;

    @property(Sprite)
    lockSprite: Sprite | null = null;

    @property(Button)
    playBtn: Button | null = null;

    @property(Sprite)
    background: Sprite | null = null;

    private levelData: LevelData | null = null;
    private isUnlocked: boolean = false;

    public setData(level: LevelData, progress: any): void {
        this.levelData = level;
        this.isUnlocked = progress.unlocked;

        if (this.nameLabel) {
            this.nameLabel.string = level.name;
        }
        if (this.descLabel) {
            this.descLabel.string = level.description;
        }
        if (this.difficultyLabel) {
            const diffNames: Record<DifficultyLevel, string> = {
                [DifficultyLevel.EASY]: '简单',
                [DifficultyLevel.MEDIUM]: '中等',
                [DifficultyLevel.HARD]: '困难',
                [DifficultyLevel.EXTREME]: '极难'
            };
            this.difficultyLabel.string = diffNames[level.difficulty] || '';

            const diffColors: Record<DifficultyLevel, Color> = {
                [DifficultyLevel.EASY]: new Color(76, 175, 80),
                [DifficultyLevel.MEDIUM]: new Color(255, 193, 7),
                [DifficultyLevel.HARD]: new Color(255, 87, 34),
                [DifficultyLevel.EXTREME]: new Color(244, 67, 54)
            };
            this.difficultyLabel.color = diffColors[level.difficulty] || Color.GRAY;
        }
        if (this.bestScoreLabel) {
            this.bestScoreLabel.string = progress.bestScore > 0 ? `最高分: ${progress.bestScore}` : '未完成';
        }

        this.updateStars(progress.stars);
        this.updateLockState();
    }

    private updateStars(stars: number): void {
        if (!this.starsContainer) return;

        const starNodes = this.starsContainer.children;
        for (let i = 0; i < starNodes.length; i++) {
            const star = starNodes[i];
            const sprite = star.getComponent(Sprite);
            if (sprite) {
                sprite.color = i < stars ? new Color(255, 193, 7) : new Color(200, 200, 200);
            }
        }
    }

    private updateLockState(): void {
        if (this.lockSprite) {
            this.lockSprite.node.active = !this.isUnlocked;
        }
        if (this.playBtn) {
            this.playBtn.interactable = this.isUnlocked;
        }
    }

    public getLevelData(): LevelData | null {
        return this.levelData;
    }

    public getIsUnlocked(): boolean {
        return this.isUnlocked;
    }
}

@ccclass('LevelSelectScene')
export class LevelSelectScene extends Component {
    @property(ScrollView)
    levelScrollView: ScrollView | null = null;

    @property(Node)
    levelContent: Node | null = null;

    @property(Prefab)
    levelItemPrefab: Prefab | null = null;

    @property(Label)
    modeLabel: Label | null = null;

    @property(Label)
    postLabel: Label | null = null;

    @property(Button)
    backBtn: Button | null = null;

    private levelItems: LevelItem[] = [];

    onLoad() {
        this.registerEvents();
    }

    start() {
        this.updateHeader();
        this.loadLevels();
    }

    private registerEvents(): void {
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBackClick, this);
        }
    }

    private updateHeader(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const mode = gameManager.getGameMode();
        const post = gameManager.getPostType();

        if (this.modeLabel) {
            const modeNames: Record<GameMode, string> = {
                [GameMode.FORMAL_TRAINING]: '正式训练',
                [GameMode.FREE_PRACTICE]: '自由练习',
                [GameMode.CHALLENGE]: '挑战模式'
            };
            this.modeLabel.string = modeNames[mode] || '';
        }

        if (this.postLabel) {
            const postNames: Record<PostType, string> = {
                [PostType.TICKET_CHECKER]: '检票员',
                [PostType.RESERVATION_CLERK]: '预约专员',
                [PostType.SITE_MANAGER]: '现场经理'
            };
            this.postLabel.string = postNames[post] || '';
        }
    }

    private loadLevels(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !this.levelContent || !this.levelItemPrefab) return;

        const mode = gameManager.getGameMode();
        const post = gameManager.getPostType();

        const levels = getLevelsByModeAndPost(mode, post);
        const saveManager = GameSaveManager.getInstance();

        this.levelContent.removeAllChildren();
        this.levelItems = [];

        for (const level of levels) {
            const node = instantiate(this.levelItemPrefab);
            this.levelContent.addChild(node);

            const item = node.getComponent(LevelItem);
            if (item) {
                const progress = saveManager.getLevelProgress(level.id);
                item.setData(level, progress);
                this.levelItems.push(item);

                const button = node.getComponent(Button) || node.addComponent(Button);
                node.on(Button.EventType.CLICK, () => {
                    this.onLevelClick(item);
                }, this);
            }
        }

        if (levels.length === 0) {
            const noLevelNode = new Node('NoLevels');
            const label = noLevelNode.addComponent(Label);
            label.string = '该岗位暂无关卡';
            label.fontSize = 18;
            label.color = Color.GRAY;
            this.levelContent.addChild(noLevelNode);
        }
    }

    private onLevelClick(item: LevelItem): void {
        if (!item.getIsUnlocked()) {
            return;
        }

        const levelData = item.getLevelData();
        if (!levelData) return;

        this.startLevel(levelData);
    }

    private startLevel(level: LevelData): void {
        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.initLevel(level);
        }

        SceneManager.instance?.goToGamePlay();
    }

    private onBackClick(): void {
        SceneManager.instance?.goToMainMenu();
    }

    public refreshLevels(): void {
        this.loadLevels();
    }
}
