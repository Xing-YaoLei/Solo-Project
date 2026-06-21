import { _decorator, Component, Node, Button, Label, Sprite, Color, tween, Vec3, ScrollView, UIOpacity } from 'cc';
import { GameMode, PostType, DifficultyLevel } from '../models/GameEnums';
import type { LevelData } from '../models';
import { getLevelsByModeAndPost } from '../data/LevelDataConfig';
import { GameSaveManager } from '../data/GameSaveManager';
import { GameManager } from '../core/GameManager';
import { UIBuilder } from '../utils/UIBuilder';
import { SceneManager, SceneName } from '../utils/SceneManager';
import { GameBootStrap } from '../GameBootStrap';
const { ccclass, property } = _decorator;

@ccclass('LevelSelectScene')
export class LevelSelectScene extends Component {
    private rootNode: Node | null = null;
    private levelContent: Node | null = null;
    private levelItems: Node[] = [];
    private headerTitle: Label | null = null;
    private headerSubtitle: Label | null = null;

    onLoad() {
        GameBootStrap.ensureInitialized();
        this.buildUI();
    }

    start() {
        this.updateHeader();
        this.loadLevels();
    }

    private buildUI(): void {
        const { width, height } = UIBuilder.getDesignResolution();

        this.rootNode = UIBuilder.createNode('LevelSelectRoot', this.node);
        UIBuilder.setPosition(this.rootNode, 0, 0);
        UIBuilder.setSize(this.rootNode, width, height);

        const bg = UIBuilder.createPanel(this.rootNode, 'Background', width, height, new Color(245, 250, 255, 255));
        UIBuilder.setPosition(bg, 0, 0);

        const topBar = UIBuilder.createPanel(this.rootNode, 'TopBar', width, 80, new Color(25, 118, 210, 255));
        UIBuilder.setPosition(topBar, 0, height / 2 - 40);

        const backBtn = UIBuilder.createTextButton(
            topBar,
            'BackBtn',
            '← 返回',
            100,
            44,
            16,
            new Color(255, 255, 255, 30),
            Color.WHITE
        );
        UIBuilder.setPosition(backBtn.node, -width / 2 + 60, 0);
        backBtn.node.on(Button.EventType.CLICK, this.onBackClick, this);

        const titleNode = UIBuilder.createNode('Title', topBar);
        UIBuilder.setPosition(titleNode, 0, 10);
        this.headerTitle = UIBuilder.addLabel(titleNode, '关卡选择', 26, Color.WHITE);
        this.headerTitle.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.headerTitle.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(titleNode, 300, 36);

        const subtitleNode = UIBuilder.createNode('Subtitle', topBar);
        UIBuilder.setPosition(subtitleNode, 0, -18);
        this.headerSubtitle = UIBuilder.addLabel(subtitleNode, '', 14, new Color(200, 220, 240));
        this.headerSubtitle.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.headerSubtitle.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(subtitleNode, 400, 20);

        const listHeight = height - 140;
        const listResult = UIBuilder.createScrollList(
            this.rootNode,
            'LevelList',
            width - 80,
            listHeight,
            120,
            16
        );
        UIBuilder.setPosition(listResult.scrollView.node, 0, -30);

        this.levelContent = listResult.content;

        const panelBg = listResult.scrollView.node.getComponent(Sprite);
        if (!panelBg) {
            const bgSprite = UIBuilder.addSprite(listResult.scrollView.node, new Color(255, 255, 255, 200));
            bgSprite.type = Sprite.Type.SLICED;
        }
    }

    private updateHeader(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const mode = gameManager.getGameMode();
        const post = gameManager.getPostType();

        const modeNames: Record<GameMode, string> = {
            [GameMode.FORMAL_TRAINING]: '正式训练',
            [GameMode.FREE_PRACTICE]: '自由练习',
            [GameMode.CHALLENGE]: '挑战模式'
        };

        const postNames: Record<PostType, string> = {
            [PostType.TICKET_CHECKER]: '检票员',
            [PostType.RESERVATION_CLERK]: '预约专员',
            [PostType.SITE_MANAGER]: '现场经理'
        };

        if (this.headerTitle) {
            this.headerTitle.string = `${modeNames[mode] || ''} · ${postNames[post] || ''}`;
        }
        if (this.headerSubtitle) {
            this.headerSubtitle.string = '选择一个关卡开始训练';
        }
    }

    private loadLevels(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !this.levelContent) return;

        const mode = gameManager.getGameMode();
        const post = gameManager.getPostType();

        const levels = getLevelsByModeAndPost(mode, post);
        const saveManager = GameSaveManager.getInstance();

        this.levelContent.removeAllChildren();
        this.levelItems = [];

        if (levels.length === 0) {
            const emptyNode = UIBuilder.createNode('EmptyHint', this.levelContent);
            UIBuilder.setSize(emptyNode, 400, 100);
            UIBuilder.setPosition(emptyNode, 0, 0);
            const emptyLabel = UIBuilder.addLabel(emptyNode, '该岗位暂未开放训练关卡\n敬请期待...', 18, new Color(158, 158, 158));
            emptyLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            emptyLabel.verticalAlign = Label.VerticalAlign.CENTER;
            emptyLabel.lineHeight = 28;
            return;
        }

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const progress = saveManager.getLevelProgress(level.id);

            const itemNode = this.createLevelItem(level, progress.unlocked, progress.bestScore, progress.stars, i + 1);
            this.levelContent.addChild(itemNode);
            this.levelItems.push(itemNode);

            const button = itemNode.getComponent(Button);
            if (button && progress.unlocked) {
                itemNode.on(Button.EventType.CLICK, () => {
                    this.onLevelClick(level);
                }, this);
            }
        }

        const contentHeight = levels.length * 136 + 20;
        UIBuilder.setSize(this.levelContent, this.levelContent.contentSize.width, contentHeight);
    }

    private createLevelItem(level: LevelData, unlocked: boolean, bestScore: number, stars: number, index: number): Node {
        const { width } = UIBuilder.getDesignResolution();
        const itemWidth = width - 100;
        const itemHeight = 120;

        const itemNode = UIBuilder.createNode(`Level_${level.id}`);
        UIBuilder.setSize(itemNode, itemWidth, itemHeight);

        const bgColor = unlocked ? Color.WHITE : new Color(240, 240, 240, 255);
        const bg = UIBuilder.addSprite(itemNode, bgColor);
        bg.type = Sprite.Type.SLICED;

        if (unlocked) {
            const button = itemNode.addComponent(Button);
            button.transition = Button.Transition.COLOR;
            button.normalColor = Color.WHITE;
            button.hoverColor = new Color(240, 248, 255);
            button.pressedColor = new Color(220, 240, 255);
        }

        const indexNode = UIBuilder.createNode('Index', itemNode);
        UIBuilder.setPosition(indexNode, -itemWidth / 2 + 40, 0);
        UIBuilder.setSize(indexNode, 48, 48);
        const indexBg = UIBuilder.addSprite(indexNode, unlocked ? new Color(33, 150, 243) : new Color(180, 180, 180));
        indexBg.type = Sprite.Type.SIMPLE;
        const indexLabel = UIBuilder.addLabel(indexNode, `${index}`, 22, Color.WHITE);
        indexLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        indexLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(indexNode, 48, 48);

        const nameNode = UIBuilder.createNode('Name', itemNode);
        UIBuilder.setPosition(nameNode, -itemWidth / 2 + 110, 30);
        UIBuilder.setSize(nameNode, 300, 30);
        const nameLabel = UIBuilder.addLabel(nameNode, level.name, 20, unlocked ? new Color(33, 33, 33) : new Color(158, 158, 158));
        nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        nameLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const descNode = UIBuilder.createNode('Desc', itemNode);
        UIBuilder.setPosition(descNode, -itemWidth / 2 + 110, 0);
        UIBuilder.setSize(descNode, 350, 24);
        const descLabel = UIBuilder.addLabel(descNode, level.description, 14, new Color(117, 117, 117));
        descLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        descLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const diffNode = UIBuilder.createNode('Difficulty', itemNode);
        UIBuilder.setPosition(diffNode, -itemWidth / 2 + 110, -32);
        UIBuilder.setSize(diffNode, 100, 24);
        const diffNames: Record<DifficultyLevel, string> = {
            [DifficultyLevel.EASY]: '简单',
            [DifficultyLevel.MEDIUM]: '中等',
            [DifficultyLevel.HARD]: '困难',
            [DifficultyLevel.EXTREME]: '极难'
        };
        const diffColors: Record<DifficultyLevel, Color> = {
            [DifficultyLevel.EASY]: new Color(76, 175, 80),
            [DifficultyLevel.MEDIUM]: new Color(255, 193, 7),
            [DifficultyLevel.HARD]: new Color(255, 87, 34),
            [DifficultyLevel.EXTREME]: new Color(244, 67, 54)
        };
        const diffLabel = UIBuilder.addLabel(diffNode, `难度: ${diffNames[level.difficulty]}`, 12, diffColors[level.difficulty]);
        diffLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        diffLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const timeNode = UIBuilder.createNode('Time', itemNode);
        UIBuilder.setPosition(timeNode, -itemWidth / 2 + 230, -32);
        UIBuilder.setSize(timeNode, 120, 24);
        const mins = Math.floor(level.timeLimit / 60);
        const secs = level.timeLimit % 60;
        const timeLabel = UIBuilder.addLabel(timeNode, `时限: ${mins}分${secs > 0 ? secs + '秒' : ''}`, 12, new Color(158, 158, 158));
        timeLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        timeLabel.verticalAlign = Label.VerticalAlign.CENTER;

        if (unlocked) {
            const starsNode = UIBuilder.createNode('Stars', itemNode);
            UIBuilder.setPosition(starsNode, itemWidth / 2 - 120, 15);
            UIBuilder.setSize(starsNode, 120, 30);
            this.createStars(starsNode, stars);

            const scoreNode = UIBuilder.createNode('Score', itemNode);
            UIBuilder.setPosition(scoreNode, itemWidth / 2 - 120, -20);
            UIBuilder.setSize(scoreNode, 120, 20);
            const scoreLabel = UIBuilder.addLabel(scoreNode, bestScore > 0 ? `最高分: ${bestScore}` : '未完成', 12, new Color(158, 158, 158));
            scoreLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
            scoreLabel.verticalAlign = Label.VerticalAlign.CENTER;

            const arrowNode = UIBuilder.createNode('Arrow', itemNode);
            UIBuilder.setPosition(arrowNode, itemWidth / 2 - 30, 0);
            const arrowLabel = UIBuilder.addLabel(arrowNode, '▶', 20, new Color(33, 150, 243));
            arrowLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            arrowLabel.verticalAlign = Label.VerticalAlign.CENTER;
        } else {
            const lockNode = UIBuilder.createNode('Lock', itemNode);
            UIBuilder.setPosition(lockNode, itemWidth / 2 - 60, 0);
            UIBuilder.setSize(lockNode, 80, 30);
            const lockLabel = UIBuilder.addLabel(lockNode, '🔒 未解锁', 14, new Color(158, 158, 158));
            lockLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            lockLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }

        return itemNode;
    }

    private createStars(parent: Node, starCount: number): void {
        const starSize = 24;
        const spacing = 8;

        for (let i = 0; i < 3; i++) {
            const starNode = UIBuilder.createNode(`Star_${i}`, parent);
            UIBuilder.setPosition(starNode, i * (starSize + spacing) - (starSize + spacing), 0);
            UIBuilder.setSize(starNode, starSize, starSize);

            const color = i < starCount ? new Color(255, 193, 7) : new Color(200, 200, 200);
            const starSprite = UIBuilder.addSprite(starNode, color);
            starSprite.type = Sprite.Type.SIMPLE;

            const starLabel = UIBuilder.addLabel(starNode, '★', 24, Color.WHITE);
            starLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            starLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }
    }

    private onLevelClick(level: LevelData): void {
        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.initLevel(level);
        }

        if (SceneManager.instance) {
            SceneManager.instance.goToScene(SceneName.GAME_PLAY);
        } else {
            const director = require('cc').director;
            director.loadScene('GamePlay');
        }
    }

    private onBackClick(): void {
        if (SceneManager.instance) {
            SceneManager.instance.goToScene(SceneName.MAIN_MENU);
        } else {
            const director = require('cc').director;
            director.loadScene('MainMenu');
        }
    }

    public refreshLevels(): void {
        this.loadLevels();
    }
}
