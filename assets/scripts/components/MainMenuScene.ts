import { _decorator, Component, Node, Button, Label, Sprite, Color, view, Vec3, tween, UIOpacity } from 'cc';
import { GameMode, PostType } from '../models/GameEnums';
import { GameManager } from '../core/GameManager';
import { SceneManager, SceneName } from '../utils/SceneManager';
import { UIBuilder } from '../utils/UIBuilder';
import { GameSaveManager } from '../data/GameSaveManager';
import { GameBootStrap } from '../GameBootStrap';
const { ccclass, property } = _decorator;

@ccclass('MainMenuScene')
export class MainMenuScene extends Component {
    private rootNode: Node | null = null;
    private modePanel: Node | null = null;
    private postPanel: Node | null = null;
    private titleLabel: Label | null = null;
    private subtitleLabel: Label | null = null;
    private statsLabel: Label | null = null;
    private selectedMode: GameMode | null = null;
    private selectedPost: PostType | null = null;

    onLoad() {
        GameBootStrap.ensureInitialized();
        this.buildUI();
    }

    start() {
        this.showModeSelection();
        this.updatePlayerStats();
    }

    private buildUI(): void {
        const { width, height } = UIBuilder.getDesignResolution();

        this.rootNode = UIBuilder.createNode('MainMenuRoot', this.node);
        UIBuilder.setPosition(this.rootNode, 0, 0);
        UIBuilder.setSize(this.rootNode, width, height);

        const bg = UIBuilder.createPanel(this.rootNode, 'Background', width, height, new Color(245, 250, 255, 255));
        UIBuilder.setPosition(bg, 0, 0);

        const titleNode = UIBuilder.createNode('Title', this.rootNode);
        UIBuilder.setPosition(titleNode, 0, height / 2 - 100);
        this.titleLabel = UIBuilder.addLabel(titleNode, '景区门票预约培训系统', 42, new Color(25, 118, 210));
        this.titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(titleNode, 600, 60);

        const subtitleNode = UIBuilder.createNode('Subtitle', this.rootNode);
        UIBuilder.setPosition(subtitleNode, 0, height / 2 - 160);
        this.subtitleLabel = UIBuilder.addLabel(subtitleNode, '掌握冲突检测 · 提升服务效率', 22, new Color(100, 150, 200));
        this.subtitleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.subtitleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(subtitleNode, 400, 30);

        const statsNode = UIBuilder.createNode('Stats', this.rootNode);
        UIBuilder.setPosition(statsNode, 0, height / 2 - 220);
        this.statsLabel = UIBuilder.addLabel(statsNode, '', 16, new Color(120, 144, 156));
        this.statsLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.statsLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(statsNode, 400, 24);

        this.buildModePanel();
        this.buildPostPanel();
    }

    private buildModePanel(): void {
        const { width, height } = UIBuilder.getDesignResolution();

        this.modePanel = UIBuilder.createPanel(
            this.rootNode!,
            'ModePanel',
            500,
            360,
            Color.WHITE
        );
        UIBuilder.setPosition(this.modePanel, 0, -20);

        const modeTitle = UIBuilder.createNode('ModeTitle', this.modePanel);
        UIBuilder.setPosition(modeTitle, 0, 140);
        const modeTitleLabel = UIBuilder.addLabel(modeTitle, '选择训练模式', 26, new Color(33, 33, 33));
        modeTitleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        modeTitleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(modeTitle, 300, 36);

        const btnWidth = 380;
        const btnHeight = 70;
        const startY = 60;
        const spacing = 90;

        const formalBtn = UIBuilder.createTextButton(
            this.modePanel,
            'FormalBtn',
            '🎓 正式训练',
            btnWidth,
            btnHeight,
            22,
            new Color(33, 150, 243),
            Color.WHITE
        );
        UIBuilder.setPosition(formalBtn.node, 0, startY);
        formalBtn.node.on(Button.EventType.CLICK, () => {
            this.onModeSelected(GameMode.FORMAL_TRAINING);
        }, this);

        const freeBtn = UIBuilder.createTextButton(
            this.modePanel,
            'FreeBtn',
            '🎯 自由练习',
            btnWidth,
            btnHeight,
            22,
            new Color(76, 175, 80),
            Color.WHITE
        );
        UIBuilder.setPosition(freeBtn.node, 0, startY - spacing);
        freeBtn.node.on(Button.EventType.CLICK, () => {
            this.onModeSelected(GameMode.FREE_PRACTICE);
        }, this);

        const challengeBtn = UIBuilder.createTextButton(
            this.modePanel,
            'ChallengeBtn',
            '⚔️ 挑战模式',
            btnWidth,
            btnHeight,
            22,
            new Color(255, 87, 34),
            Color.WHITE
        );
        UIBuilder.setPosition(challengeBtn.node, 0, startY - spacing * 2);
        challengeBtn.node.on(Button.EventType.CLICK, () => {
            this.onModeSelected(GameMode.CHALLENGE);
        }, this);
    }

    private buildPostPanel(): void {
        const { width, height } = UIBuilder.getDesignResolution();

        this.postPanel = UIBuilder.createPanel(
            this.rootNode!,
            'PostPanel',
            500,
            400,
            Color.WHITE
        );
        UIBuilder.setPosition(this.postPanel, 0, -40);

        const postTitle = UIBuilder.createNode('PostTitle', this.postPanel);
        UIBuilder.setPosition(postTitle, 0, 160);
        const postTitleLabel = UIBuilder.addLabel(postTitle, '选择岗位类型', 26, new Color(33, 33, 33));
        postTitleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        postTitleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(postTitle, 300, 36);

        const postDesc = UIBuilder.createNode('PostDesc', this.postPanel);
        UIBuilder.setPosition(postDesc, 0, 125);
        const postDescLabel = UIBuilder.addLabel(postDesc, '不同岗位训练内容和难度有所不同', 14, new Color(158, 158, 158));
        postDescLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        postDescLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(postDesc, 350, 20);

        const btnWidth = 380;
        const btnHeight = 72;
        const startY = 50;
        const spacing = 95;

        const ticketBtn = UIBuilder.createTextButton(
            this.postPanel,
            'TicketCheckerBtn',
            '🎫 检票员\n入门级 · 基础预约审核',
            btnWidth,
            btnHeight,
            18,
            new Color(103, 58, 183),
            Color.WHITE
        );
        UIBuilder.setPosition(ticketBtn.node, 0, startY);
        ticketBtn.node.on(Button.EventType.CLICK, () => {
            this.onPostSelected(PostType.TICKET_CHECKER);
        }, this);

        const reservationBtn = UIBuilder.createTextButton(
            this.postPanel,
            'ReservationClerkBtn',
            '📋 预约专员\n进阶级 · 多时段预约管理',
            btnWidth,
            btnHeight,
            18,
            new Color(0, 150, 136),
            Color.WHITE
        );
        UIBuilder.setPosition(reservationBtn.node, 0, startY - spacing);
        reservationBtn.node.on(Button.EventType.CLICK, () => {
            this.onPostSelected(PostType.RESERVATION_CLERK);
        }, this);

        const managerBtn = UIBuilder.createTextButton(
            this.postPanel,
            'SiteManagerBtn',
            '👔 现场经理\n高级 · 综合场景处理',
            btnWidth,
            btnHeight,
            18,
            new Color(255, 152, 0),
            Color.WHITE
        );
        UIBuilder.setPosition(managerBtn.node, 0, startY - spacing * 2);
        managerBtn.node.on(Button.EventType.CLICK, () => {
            this.onPostSelected(PostType.SITE_MANAGER);
        }, this);

        const backBtn = UIBuilder.createTextButton(
            this.postPanel,
            'BackBtn',
            '← 返回',
            120,
            44,
            16,
            new Color(158, 158, 158),
            Color.WHITE
        );
        UIBuilder.setPosition(backBtn.node, -180, -170);
        backBtn.node.on(Button.EventType.CLICK, this.onBackClick, this);
    }

    private showModeSelection(): void {
        if (this.modePanel) {
            this.modePanel.active = true;
            this.playPanelEnterAnim(this.modePanel);
        }
        if (this.postPanel) {
            this.postPanel.active = false;
        }

        this.selectedMode = null;
        this.selectedPost = null;
    }

    private showPostSelection(): void {
        if (this.modePanel) {
            this.modePanel.active = false;
        }
        if (this.postPanel) {
            this.postPanel.active = true;
            this.playPanelEnterAnim(this.postPanel);
        }
    }

    private playPanelEnterAnim(panel: Node): void {
        panel.setScale(0.9, 0.9, 1);
        const opacity = panel.getComponent(UIOpacity);
        if (!opacity) {
            UIBuilder.addUIOpacity(panel, 0);
        }
        const op = panel.getComponent(UIOpacity)!;
        op.opacity = 0;

        tween(panel)
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
        tween(op)
            .to(0.2, { opacity: 255 })
            .start();
    }

    private onModeSelected(mode: GameMode): void {
        this.selectedMode = mode;

        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.setGameMode(mode);
        }

        this.showPostSelection();
    }

    private onPostSelected(post: PostType): void {
        this.selectedPost = post;

        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.setPostType(post);
        }

        this.goToLevelSelect();
    }

    private onBackClick(): void {
        this.showModeSelection();
    }

    private goToLevelSelect(): void {
        if (SceneManager.instance) {
            SceneManager.instance.goToScene(SceneName.LEVEL_SELECT);
        } else {
            const director = require('cc').director;
            director.loadScene('LevelSelect');
        }
    }

    private updatePlayerStats(): void {
        const saveManager = GameSaveManager.getInstance();
        const stars = saveManager.getTotalStars();
        const levels = saveManager.getCompletedLevelsCount();

        if (this.statsLabel) {
            this.statsLabel.string = `已完成关卡: ${levels}    累计星星: ${stars}⭐`;
        }
    }

    public getSelectedMode(): GameMode | null {
        return this.selectedMode;
    }

    public getSelectedPost(): PostType | null {
        return this.selectedPost;
    }
}
