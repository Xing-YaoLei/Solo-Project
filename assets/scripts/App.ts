import { _decorator, Component, Node, Label, Button, Sprite, Color, UITransform, Vec3, Canvas, view, Graphics, tween, UIOpacity, Layout, find, ProgressBar } from 'cc';
import { ResourceGenerator, ResourceType } from './utils/ResourceGenerator';
import { UIBuilder } from './utils/UIBuilder';
import { GameManager } from './GameManager';
import { ScoreManager } from './ScoreManager';
import { levelManager } from './LevelManager';
import { TiledMapController } from './TiledMapController';
import { LEVEL_CONFIGS, LevelConfig } from './data/LevelConfig';
import { MedicineItem, VisitRecord, ActivityItem, LevelResult, ElderlyProfile } from './data/ElderlyData';
const { ccclass } = _decorator;

type GameState = 'menu' | 'levelSelect' | 'game' | 'review' | 'settings' | 'tutorial';
type TaskType = 'medicine' | 'visit' | 'activity';

@ccclass('App')
export class App extends Component {
    private _canvasNode: Node | null = null;
    private _rootNode: Node | null = null;
    private _currentState: GameState = 'menu';
    private _currentLevelId: number = 1;
    private _currentTaskType: TaskType = 'medicine';
    private _scoreManager: ScoreManager = new ScoreManager();
    private _timerInterval: number | null = null;
    private _gameRunning: boolean = false;
    private _processedTasks: Set<string> = new Set();
    private _tutorialStep: number = 0;
    private _onTutorialComplete: (() => void) | null = null;

    onLoad() {
        console.log('[App] Loading...');
        this.init();
    }

    init(): void {
        ResourceGenerator.preloadAll();
        GameManager.instance;

        this._canvasNode = find('Canvas') || this.createCanvas();
        if (!this._canvasNode.parent) {
            this.node.addChild(this._canvasNode);
        }

        this._rootNode = new Node('GameRoot');
        this._rootNode.addComponent(UITransform).setContentSize(750, 1334);
        this._canvasNode.addChild(this._rootNode);

        this.showMainMenu();
        console.log('[App] Initialized successfully');
    }

    createCanvas(): Node {
        const canvasNode = new Node('Canvas');
        canvasNode.addComponent(Canvas);
        const transform = canvasNode.addComponent(UITransform);
        transform.setContentSize(750, 1334);
        view.setDesignResolutionSize(750, 1334, 2);
        return canvasNode;
    }

    clearRoot(): void {
        if (this._rootNode) {
            this._rootNode.removeAllChildren();
        }
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
        this._gameRunning = false;
    }

    animateIn(): void {
        if (!this._rootNode) return;
        const intensity = GameManager.instance.getAnimationMultiplier();
        this._rootNode.setScale(0.98, 0.98, 1);
        const opacity = this._rootNode.getComponent(UIOpacity) || this._rootNode.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.25 * intensity, { opacity: 255 }).start();
        tween(this._rootNode).to(0.25 * intensity, { scale: Vec3.ONE }, { easing: 'backOut' }).start();
    }

    showMainMenu(): void {
        this._currentState = 'menu';
        this.clearRoot();

        const bg = new Node('BG');
        bg.setContentSize(750, 1334);
        const bgSprite = bg.addComponent(Sprite);
        bgSprite.color = new Color(245, 240, 230, 255);
        this._rootNode!.addChild(bg);

        const titleLabel = UIBuilder.createLabel('养老护理评估中心', 48, new Color(74, 144, 217, 255));
        titleLabel.setPosition(0, 450, 0);
        this._rootNode!.addChild(titleLabel);

        const subtitleLabel = UIBuilder.createLabel('入住评估经营模拟', 24, new Color(120, 120, 120, 255));
        subtitleLabel.setPosition(0, 400, 0);
        this._rootNode!.addChild(subtitleLabel);

        const mapPreview = this.createMiniMap();
        mapPreview.setPosition(0, 150, 0);
        this._rootNode!.addChild(mapPreview);

        const startBtn = UIBuilder.createButton('开始游戏', 260, 64, () => {
            GameManager.instance.playSound('click');
            const levelId = this.findContinueLevel();
            this.startLevel(levelId);
        }, 'primary');
        startBtn.setPosition(0, -100, 0);
        this._rootNode!.addChild(startBtn);

        const levelSelectBtn = UIBuilder.createButton('关卡选择', 220, 52, () => {
            GameManager.instance.playSound('click');
            this.showLevelSelect();
        }, 'secondary');
        levelSelectBtn.setPosition(0, -200, 0);
        this._rootNode!.addChild(levelSelectBtn);

        const bottomRow = new Node('BottomRow');
        bottomRow.addComponent(Layout);
        const bottomLayout = bottomRow.getComponent(Layout)!;
        bottomLayout.type = Layout.Type.HORIZONTAL;
        bottomLayout.spacingX = 20;
        bottomRow.setPosition(0, -320, 0);
        this._rootNode!.addChild(bottomRow);

        const reviewBtn = UIBuilder.createButton('护理复盘', 140, 48, () => {
            GameManager.instance.playSound('click');
            this.showReview();
        }, 'secondary');
        bottomRow.addChild(reviewBtn);

        const settingsBtn = UIBuilder.createButton('设置', 140, 48, () => {
            GameManager.instance.playSound('click');
            this.showSettings();
        }, 'secondary');
        bottomRow.addChild(settingsBtn);

        this.animateIn();
    }

    createMiniMap(): Node {
        const mapNode = new Node('MiniMap');
        mapNode.setContentSize(600, 340);
        const mapSprite = mapNode.addComponent(Sprite);
        mapSprite.color = new Color(255, 255, 255, 255);
        mapSprite.type = Sprite.Type.SLICED;
        mapSprite.spriteFrame = ResourceGenerator.getSpriteFrame('panel_bg');

        const g = mapNode.addComponent(Graphics);
        const tileSize = 34;
        const cols = 15;
        const rows = 8;
        const offsetX = -cols * tileSize / 2 + tileSize / 2;
        const offsetY = rows * tileSize / 2 - tileSize / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = offsetX + c * tileSize;
                const y = offsetY - r * tileSize;
                g.fillColor = (r + c) % 2 === 0
                    ? new Color(245, 230, 210, 255)
                    : new Color(232, 213, 183, 255);
                g.rect(x - tileSize / 2 + 1, y - tileSize / 2 + 1, tileSize - 2, tileSize - 2);
                g.fill();
            }
        }

        const beds = [[2, 2], [2, 3], [3, 2], [3, 3], [10, 2], [10, 3], [11, 2], [11, 3], [2, 5], [2, 6], [10, 5], [10, 6]];
        beds.forEach(([c, r]) => {
            const x = offsetX + c * tileSize;
            const y = offsetY - r * tileSize;
            g.fillColor = new Color(139, 115, 85, 255);
            g.rect(x - 12, y - 12, 24, 24);
            g.fill();
            g.fillColor = new Color(255, 255, 255, 255);
            g.rect(x - 10, y - 10, 20, 10);
            g.fill();
        });

        const elderlyPositions = [[7, 3], [6, 4], [8, 4], [7, 5]];
        elderlyPositions.forEach(([c, r]) => {
            const x = offsetX + c * tileSize;
            const y = offsetY - r * tileSize;
            g.fillColor = new Color(255, 218, 185, 255);
            g.circle(x, y, 10);
            g.fill();
            g.fillColor = new Color(74, 144, 217, 255);
            g.rect(x - 8, y + 4, 16, 10);
            g.fill();
        });

        return mapNode;
    }

    findContinueLevel(): number {
        for (let i = 1; i <= 5; i++) {
            const result = GameManager.instance.getLevelResult(i);
            if (!result || !result.passed) return i;
        }
        return 1;
    }

    showLevelSelect(): void {
        this._currentState = 'levelSelect';
        this.clearRoot();

        const bg = new Node('BG');
        bg.setContentSize(750, 1334);
        const bgSprite = bg.addComponent(Sprite);
        bgSprite.color = new Color(245, 240, 230, 255);
        this._rootNode!.addChild(bg);

        const header = new Node('Header');
        header.setContentSize(750, 100);
        header.setPosition(0, 600, 0);
        this._rootNode!.addChild(header);

        const backBtn = UIBuilder.createButton('← 返回', 100, 44, () => {
            GameManager.instance.playSound('click');
            this.showMainMenu();
        }, 'secondary');
        backBtn.setPosition(-290, 0, 0);
        header.addChild(backBtn);

        const titleLabel = UIBuilder.createLabel('选择关卡', 32, new Color(60, 60, 60, 60));
        titleLabel.setPosition(0, 0, 0);
        header.addChild(titleLabel);

        const scroll = UIBuilder.createScrollView(680, 1000);
        scroll.setPosition(0, 0, 0);
        this._rootNode!.addChild(scroll);

        const content = scroll.getChildByName('View')!.getChildByName('Content')!;

        LEVEL_CONFIGS.forEach(config => {
            const item = this.createLevelItem(config);
            content.addChild(item);
        });

        this.animateIn();
    }

    createLevelItem(config: LevelConfig): Node {
        const unlocked = GameManager.instance.isLevelUnlocked(config.id);
        const result = GameManager.instance.getLevelResult(config.id);

        const node = new Node(`Level_${config.id}`);
        node.setContentSize(650, 140);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = ResourceGenerator.getSpriteFrame('panel_bg');
        sprite.type = Sprite.Type.SLICED;

        if (!unlocked) {
            sprite.color = new Color(230, 230, 230, 255);
        } else if (result?.starCount === 3) {
            sprite.color = new Color(255, 250, 230, 255);
        }

        const numLabel = UIBuilder.createLabel(`${config.id}`, 36, unlocked ? new Color(74, 144, 217, 255) : new Color(180, 180, 180, 255));
        numLabel.setPosition(-270, 0, 0);
        node.addChild(numLabel);

        const nameLabel = UIBuilder.createLabel(config.name, 24, unlocked ? new Color(50, 50, 50, 255) : new Color(180, 180, 180, 255), 0);
        nameLabel.setContentSize(350, 32);
        nameLabel.setAnchorPoint(0, 0.5);
        nameLabel.setPosition(-180, 25, 0);
        node.addChild(nameLabel);

        const descLabel = UIBuilder.createLabel(config.description, 16, unlocked ? new Color(120, 120, 120, 255) : new Color(200, 200, 200, 255), 0);
        descLabel.setContentSize(350, 22);
        descLabel.setAnchorPoint(0, 0.5);
        descLabel.setPosition(-180, -5, 0);
        node.addChild(descLabel);

        const starsRow = new Node('Stars');
        starsRow.addComponent(Layout);
        const starsLayout = starsRow.getComponent(Layout)!;
        starsLayout.type = Layout.Type.HORIZONTAL;
        starsLayout.spacingX = 4;
        starsRow.setPosition(-180, -35, 0);
        starsRow.setAnchorPoint(0, 0.5);
        node.addChild(starsRow);

        for (let i = 0; i < 3; i++) {
            const star = UIBuilder.createStar((result?.starCount || 0) > i, 28);
            starsRow.addChild(star);
        }

        const diffLabel = UIBuilder.createLabel('⭐'.repeat(config.difficulty), 16, new Color(255, 180, 0, 255));
        diffLabel.setPosition(50, -35, 0);
        node.addChild(diffLabel);

        if (unlocked) {
            node.addComponent(Button);
            const btn = node.getComponent(Button)!;
            btn.transition = Button.Transition.SCALE;
            btn.zoomScale = 0.97;
            btn.node.on(Button.EventType.CLICK, () => {
                GameManager.instance.playSound('click');
                this.startLevel(config.id);
            });
        }

        if (!unlocked) {
            const lockLabel = UIBuilder.createLabel('🔒', 28, new Color(180, 180, 180, 255));
            lockLabel.setPosition(270, 0, 0);
            node.addChild(lockLabel);
        }

        return node;
    }

    startLevel(levelId: number): void {
        this._currentLevelId = levelId;
        this._currentState = 'game';

        const needTutorial = !GameManager.instance.tutorialCompleted && levelId === 1;

        this.clearRoot();
        this.buildGameScene(levelId);

        if (needTutorial) {
            this.showTutorial(() => {
                this.beginGame();
            });
        } else {
            this.beginGame();
        }
    }

    buildGameScene(levelId: number): void {
        const config = LEVEL_CONFIGS.find(l => l.id === levelId);
        if (!config) return;

        levelManager.loadLevel(levelId);
        this._currentTaskType = config.taskTypes[0] as TaskType;
        this._processedTasks.clear();

        const bg = new Node('BG');
        bg.setContentSize(750, 1334);
        const bgSprite = bg.addComponent(Sprite);
        bgSprite.color = new Color(240, 245, 250, 255);
        this._rootNode!.addChild(bg);

        this.buildTopHUD(config);
        this.buildTiledMapPreview();
        this.buildTaskTabs(config);
        this.buildTaskList();
        this.buildResultPanel();
    }

    buildTopHUD(config: LevelConfig): void {
        const hud = new Node('HUD');
        hud.setContentSize(750, 180);
        hud.setPosition(0, 570, 0);
        this._rootNode!.addChild(hud);

        const backBtn = UIBuilder.createButton('←', 60, 44, () => {
            GameManager.instance.playSound('click');
            if (confirm('确定要退出当前关卡吗？')) {
                this.showLevelSelect();
            }
        }, 'secondary');
        backBtn.setPosition(-320, 40, 0);
        hud.addChild(backBtn);

        const levelLabel = UIBuilder.createLabel(`第${config.id}关: ${config.name}`, 24, new Color(60, 60, 60, 255));
        levelLabel.setPosition(0, 40, 0);
        hud.addChild(levelLabel);

        const scoreBg = new Node('ScoreBg');
        scoreBg.setContentSize(140, 56);
        const scoreBgSprite = scoreBg.addComponent(Sprite);
        scoreBgSprite.spriteFrame = ResourceGenerator.getSpriteFrame('card_bg');
        scoreBgSprite.type = Sprite.Type.SLICED;
        scoreBg.setPosition(280, 40, 0);
        hud.addChild(scoreBg);

        const scoreLabelNode = new Node('ScoreLabel');
        const scoreLabel = scoreLabelNode.addComponent(Label);
        scoreLabel.string = '0';
        scoreLabel.fontSize = 28;
        scoreLabel.color = new Color(74, 144, 217, 255);
        scoreLabelNode.name = 'ScoreValue';
        scoreBg.addChild(scoreLabelNode);

        const scoreTitle = UIBuilder.createLabel('得分', 12, new Color(150, 150, 150, 255));
        scoreTitle.setPosition(0, -18, 0);
        scoreBg.addChild(scoreTitle);

        const comboLabelNode = new Node('ComboLabel');
        const comboLabel = comboLabelNode.addComponent(Label);
        comboLabel.string = '';
        comboLabel.fontSize = 22;
        comboLabel.color = new Color(255, 152, 0, 255);
        comboLabelNode.setPosition(0, 0, 0);
        comboLabelNode.name = 'ComboValue';
        hud.addChild(comboLabelNode);

        const timeBar = UIBuilder.createProgressBar(500, 20);
        timeBar.setPosition(0, -30, 0);
        timeBar.name = 'TimeBar';
        hud.addChild(timeBar);

        const timeLabelNode = new Node('TimeLabel');
        const timeLabel = timeLabelNode.addComponent(Label);
        timeLabel.string = '02:00';
        timeLabel.fontSize = 18;
        timeLabel.color = new Color(80, 80, 80, 255);
        timeLabelNode.setPosition(0, -30, 0);
        timeLabelNode.name = 'TimeValue';
        hud.addChild(timeLabelNode);

        const statsRow = new Node('StatsRow');
        statsRow.addComponent(Layout);
        const statsLayout = statsRow.getComponent(Layout)!;
        statsLayout.type = Layout.Type.HORIZONTAL;
        statsLayout.spacingX = 40;
        statsRow.setPosition(0, -75, 0);
        hud.addChild(statsRow);

        const correctLabel = UIBuilder.createLabel('✓ 0', 18, new Color(76, 175, 80, 255));
        correctLabel.name = 'CorrectValue';
        statsRow.addChild(correctLabel);

        const wrongLabel = UIBuilder.createLabel('✗ 0', 18, new Color(244, 67, 54, 255));
        wrongLabel.name = 'WrongValue';
        statsRow.addChild(wrongLabel);

        const countLabel = UIBuilder.createLabel('任务 0/0', 18, new Color(100, 100, 100, 255));
        countLabel.name = 'CountValue';
        statsRow.addChild(countLabel);
    }

    buildTiledMapPreview(): void {
        const mapContainer = new Node('TiledMap');
        mapContainer.setContentSize(700, 240);
        mapContainer.setPosition(0, 360, 0);
        const mapSprite = mapContainer.addComponent(Sprite);
        mapSprite.spriteFrame = ResourceGenerator.getSpriteFrame('card_bg');
        mapSprite.type = Sprite.Type.SLICED;
        this._rootNode!.addChild(mapContainer);

        const mapNode = new Node('Map');
        mapNode.addComponent(UITransform).setContentSize(700, 240);
        mapNode.setPosition(0, 0, 0);
        mapContainer.addChild(mapNode);

        const mapController = mapNode.addComponent(TiledMapController);
        mapController.mapScale = 0.36;
        mapController.showElderlyNames = false;

        const title = UIBuilder.createLabel('🏠 养老院楼层地图', 16, new Color(100, 100, 100, 255), 0);
        title.setPosition(-330, 100, 0);
        mapContainer.addChild(title);

        const elderlyCount = levelManager.elderlyProfiles.length;
        const countLabel = UIBuilder.createLabel(`在住老人: ${elderlyCount}位`, 14, new Color(150, 150, 150, 255), 2);
        countLabel.setPosition(320, 100, 0);
        mapContainer.addChild(countLabel);
    }

    buildTaskTabs(config: LevelConfig): void {
        const tabsContainer = new Node('TaskTabs');
        tabsContainer.addComponent(Layout);
        const layout = tabsContainer.getComponent(Layout)!;
        layout.type = Layout.Type.HORIZONTAL;
        layout.spacingX = 10;
        tabsContainer.setPosition(0, 240, 0);
        this._rootNode!.addChild(tabsContainer);

        const allTypes: { type: TaskType; label: string }[] = [
            { type: 'medicine', label: '💊 用药清单' },
            { type: 'visit', label: '👨‍👩‍👧 探访记录' },
            { type: 'activity', label: '🎯 活动签到' },
        ];

        allTypes.forEach(({ type, label }) => {
            const enabled = config.taskTypes.includes(type);
            if (!enabled) return;

            const isActive = type === this._currentTaskType;
            const tab = UIBuilder.createTab(label, isActive, () => {
                GameManager.instance.playSound('click');
                this.switchTaskType(type);
            });
            tab.name = `Tab_${type}`;
            tabsContainer.addChild(tab);
        });
    }

    switchTaskType(type: TaskType): void {
        this._currentTaskType = type;

        const tabsContainer = this._rootNode!.getChildByName('TaskTabs');
        if (tabsContainer) {
            tabsContainer.children.forEach(tab => {
                const label = tab.getComponentInChildren(Label);
                const sprite = tab.getComponent(Sprite);
                const isActive = tab.name === `Tab_${type}`;
                if (sprite) {
                    sprite.spriteFrame = ResourceGenerator.getSpriteFrame(isActive ? 'tab_active' : 'tab_inactive');
                }
                if (label) {
                    label.color = isActive ? Color.WHITE : new Color(100, 100, 100, 255);
                }
            });
        }

        this.refreshTaskList();
    }

    buildTaskList(): void {
        const scroll = UIBuilder.createScrollView(700, 440);
        scroll.setPosition(0, -40, 0);
        scroll.name = 'TaskScroll';
        this._rootNode!.addChild(scroll);

        this.refreshTaskList();
    }

    refreshTaskList(): void {
        const scroll = this._rootNode!.getChildByName('TaskScroll');
        if (!scroll) return;

        const content = scroll.getChildByName('View')!.getChildByName('Content')!;
        content.removeAllChildren();

        const tasks = levelManager.getTasksByType(this._currentTaskType);

        if (tasks.length === 0) {
            const emptyLabel = UIBuilder.createLabel('暂无任务', 24, new Color(180, 180, 180, 255));
            emptyLabel.setPosition(0, -100, 0);
            content.addChild(emptyLabel);
            return;
        }

        const title = UIBuilder.createLabel(
            this._currentTaskType === 'medicine' ? '💊 请核对以下用药清单，点击正确的条目' :
            this._currentTaskType === 'visit' ? '👨‍👩‍👧 请核对以下探访记录，点击正确的条目' :
            '🎯 请核对以下活动签到，点击正确的条目',
            18, new Color(120, 120, 120, 255), 0
        );
        title.setContentSize(650, 28);
        title.setAnchorPoint(0, 0.5);
        title.setPosition(10, 0, 0);
        content.addChild(title);

        tasks.forEach((task: any) => {
            const processed = this._processedTasks.has(task.id);
            let titleText = '';
            let subtitleText = '';

            if (this._currentTaskType === 'medicine') {
                titleText = (task as MedicineItem).name;
                subtitleText = `${(task as MedicineItem).dosage} · ${(task as MedicineItem).time}`;
            } else if (this._currentTaskType === 'visit') {
                titleText = `${(task as VisitRecord).visitorName}（${(task as VisitRecord).visitorRelation}）`;
                subtitleText = (task as VisitRecord).visitTime;
            } else {
                titleText = (task as ActivityItem).name;
                subtitleText = `${(task as ActivityItem).time} · ${(task as ActivityItem).location}`;
            }

            const card = UIBuilder.createTaskCard(titleText, subtitleText, task.isCorrect, () => {
                if (!this._gameRunning || processed) return;
                this.handleTaskClick(task);
            });

            if (processed) {
                const sprite = card.getComponent(Sprite)!;
                sprite.spriteFrame = ResourceGenerator.getSpriteFrame('card_processed');
                card.opacity = 120;
            }

            card.name = `Task_${task.id}`;
            content.addChild(card);
        });
    }

    handleTaskClick(task: any): void {
        if (this._processedTasks.has(task.id)) return;
        this._processedTasks.add(task.id);

        levelManager.markTaskProcessed(task.id, this._currentTaskType);

        const isCorrect = task.isCorrect;
        let points = 0;

        if (isCorrect) {
            points = this._scoreManager.addCorrect(1);
            GameManager.instance.playSound('correct');
            GameManager.instance.vibrate(30);
        } else {
            points = this._scoreManager.addWrong();
            GameManager.instance.playSound('wrong');
            GameManager.instance.vibrate(100);
        }

        this.showScorePopup(points, isCorrect);
        this.updateHUD();
        this.refreshTaskList();

        if (this._scoreManager.combo >= 3) {
            GameManager.instance.playSound('combo');
            this.showComboPopup(this._scoreManager.combo);
        }

        if (levelManager.isAllTasksCompleted()) {
            this._scoreManager.stopTimer();
            this.endGame();
        }
    }

    showScorePopup(points: number, isCorrect: boolean): void {
        const popup = new Node('ScorePopup');
        popup.setContentSize(150, 50);
        popup.setPosition(0, 0, 0);
        this._rootNode!.addChild(popup);

        const label = popup.addComponent(Label);
        label.string = isCorrect ? `+${points}` : `-${points}`;
        label.fontSize = 36;
        label.color = isCorrect
            ? new Color(76, 175, 80, 255)
            : new Color(244, 67, 54, 255);

        const intensity = GameManager.instance.getAnimationMultiplier();
        popup.setScale(0.5, 0.5, 1);
        tween(popup)
            .to(0.15 * intensity, { scale: new Vec3(1.3, 1.3, 1) })
            .to(0.1 * intensity, { scale: Vec3.ONE })
            .by(0.6 * intensity, { position: new Vec3(0, 120, 0) })
            .call(() => popup.destroy())
            .start();

        const opacity = popup.addComponent(UIOpacity);
        tween(opacity)
            .delay(0.5)
            .to(0.3, { opacity: 0 })
            .start();
    }

    showComboPopup(combo: number): void {
        const popup = new Node('ComboPopup');
        popup.setContentSize(300, 60);
        popup.setPosition(0, 100, 0);
        this._rootNode!.addChild(popup);

        const label = popup.addComponent(Label);
        label.string = `🔥 ${combo}连击!`;
        label.fontSize = 42;
        label.color = new Color(255, 152, 0, 255);

        const intensity = GameManager.instance.getAnimationMultiplier();
        popup.setScale(0.3, 0.3, 1);
        tween(popup)
            .to(0.2 * intensity, { scale: new Vec3(1.4, 1.4, 1) }, { easing: 'backOut' })
            .to(0.1 * intensity, { scale: Vec3.ONE })
            .delay(0.8)
            .to(0.2 * intensity, { scale: new Vec3(0, 0, 1) })
            .call(() => popup.destroy())
            .start();
    }

    updateHUD(): void {
        const hud = this._rootNode!.getChildByName('HUD');
        if (!hud) return;

        const scoreBg = hud.getChildByName('ScoreBg');
        if (scoreBg) {
            const scoreVal = scoreBg.getChildByName('ScoreValue');
            const scoreLabel = scoreVal?.getComponent(Label);
            if (scoreLabel) {
                scoreLabel.string = this._scoreManager.score.toString();
                tween(scoreLabel.node)
                    .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
                    .to(0.1, { scale: Vec3.ONE })
                    .start();
            }
        }

        const comboVal = hud.getChildByName('ComboValue');
        const comboLabel = comboVal?.getComponent(Label);
        if (comboLabel) {
            comboLabel.string = this._scoreManager.combo > 1 ? `🔥 连击x${this._scoreManager.combo}` : '';
        }

        const timeBar = hud.getChildByName('TimeBar');
        const timeVal = hud.getChildByName('TimeValue')?.getComponent(Label);
        const config = LEVEL_CONFIGS.find(l => l.id === this._currentLevelId);
        if (timeBar && timeVal && config) {
            const remaining = this._scoreManager.remainingTime;
            const progress = remaining / config.timeLimit;
            const pbComp = timeBar.getComponent(ProgressBar);
            if (pbComp) pbComp.progress = Math.max(0, progress);

            const bar = hud.getChildByName('TimeBar')?.getChildByName('Bar');
            const barSprite = bar?.getComponent(Sprite);
            if (barSprite) {
                if (progress < 0.3) {
                    barSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_red');
                } else if (progress < 0.6) {
                    barSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_yellow');
                } else {
                    barSprite.spriteFrame = ResourceGenerator.getSpriteFrame('progress_bar_green');
                }
            }

            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            timeVal.string = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        const statsRow = hud.getChildByName('StatsRow');
        if (statsRow) {
            const correctLabel = statsRow.getChildByName('CorrectValue')?.getComponent(Label);
            if (correctLabel) correctLabel.string = `✓ ${this._scoreManager.correctCount}`;

            const wrongLabel = statsRow.getChildByName('WrongValue')?.getComponent(Label);
            if (wrongLabel) wrongLabel.string = `✗ ${this._scoreManager.wrongCount}`;

            const countLabel = statsRow.getChildByName('CountValue')?.getComponent(Label);
            if (countLabel) {
                const total = levelManager.getTotalTaskCount();
                const done = this._processedTasks.size;
                countLabel.string = `任务 ${done}/${total}`;
            }
        }
    }

    beginGame(): void {
        const config = LEVEL_CONFIGS.find(l => l.id === this._currentLevelId);
        if (!config) return;

        this._scoreManager.reset(config.timeLimit);
        this._scoreManager.startTimer();
        this._gameRunning = true;
        this._processedTasks.clear();
        levelManager.loadLevel(this._currentLevelId);

        this._timerInterval = window.setInterval(() => {
            if (!this._gameRunning) return;
            this.updateHUD();

            if (this._scoreManager.isTimeUp) {
                this.endGame();
            }
        }, 200);

        this.updateHUD();
        this.refreshTaskList();
    }

    buildResultPanel(): void {
        const panel = UIBuilder.createPanel(660, 780);
        panel.name = 'ResultPanel';
        panel.setPosition(0, 0, 0);
        panel.active = false;
        this._rootNode!.addChild(panel);

        const titleLabel = UIBuilder.createLabel('关卡完成', 36, new Color(60, 60, 60, 255));
        titleLabel.setPosition(0, 340, 0);
        titleLabel.name = 'ResultTitle';
        panel.addChild(titleLabel);

        const starsRow = new Node('StarsRow');
        starsRow.addComponent(Layout);
        const starsLayout = starsRow.getComponent(Layout)!;
        starsLayout.type = Layout.Type.HORIZONTAL;
        starsLayout.spacingX = 20;
        starsRow.setPosition(0, 250, 0);
        panel.addChild(starsRow);
        for (let i = 0; i < 3; i++) {
            const star = UIBuilder.createStar(false, 60);
            star.name = `Star_${i}`;
            starsRow.addChild(star);
        }

        const scoreBg = new Node('ScoreBg');
        scoreBg.setContentSize(200, 100);
        const scoreSprite = scoreBg.addComponent(Sprite);
        scoreSprite.spriteFrame = ResourceGenerator.getSpriteFrame('card_bg');
        scoreSprite.type = Sprite.Type.SLICED;
        scoreBg.setPosition(0, 130, 0);
        panel.addChild(scoreBg);

        const scoreLabel = UIBuilder.createLabel('0', 48, new Color(74, 144, 217, 255));
        scoreLabel.name = 'FinalScore';
        scoreBg.addChild(scoreLabel);

        const scoreTitle = UIBuilder.createLabel('总得分', 14, new Color(150, 150, 150, 255));
        scoreTitle.setPosition(0, -38, 0);
        scoreBg.addChild(scoreTitle);

        const statsCol = new Node('StatsCol');
        statsCol.addComponent(Layout);
        const statsLayout = statsCol.getComponent(Layout)!;
        statsLayout.type = Layout.Type.VERTICAL;
        statsLayout.spacingY = 12;
        statsCol.setPosition(0, -50, 0);
        panel.addChild(statsCol);

        const speedLabel = UIBuilder.createLabel('速度分: 0', 20, new Color(76, 175, 80, 255));
        speedLabel.name = 'SpeedScore';
        statsCol.addChild(speedLabel);

        const accLabel = UIBuilder.createLabel('准确率: 0%', 20, new Color(33, 150, 243, 255));
        accLabel.name = 'AccuracyScore';
        statsCol.addChild(accLabel);

        const comboLabel = UIBuilder.createLabel('最高连击: 0', 20, new Color(255, 152, 0, 255));
        comboLabel.name = 'ComboScore';
        statsCol.addChild(comboLabel);

        const timeLabel = UIBuilder.createLabel('用时: 0秒', 20, new Color(100, 100, 100, 255));
        timeLabel.name = 'TimeUsed';
        statsCol.addChild(timeLabel);

        const btnsRow = new Node('BtnsRow');
        btnsRow.addComponent(Layout);
        const btnsLayout = btnsRow.getComponent(Layout)!;
        btnsLayout.type = Layout.Type.HORIZONTAL;
        btnsLayout.spacingX = 15;
        btnsRow.setPosition(0, -280, 0);
        panel.addChild(btnsRow);

        const reviewBtn = UIBuilder.createButton('护理复盘', 150, 52, () => {
            GameManager.instance.playSound('click');
            this.showReview();
        }, 'secondary');
        reviewBtn.name = 'BtnReview';
        btnsRow.addChild(reviewBtn);

        const retryBtn = UIBuilder.createButton('快速重开', 150, 52, () => {
            GameManager.instance.playSound('click');
            this.startLevel(this._currentLevelId);
        }, 'secondary');
        retryBtn.name = 'BtnRetry';
        btnsRow.addChild(retryBtn);

        const nextBtn = UIBuilder.createButton('下一关', 150, 52, () => {
            GameManager.instance.playSound('click');
            const nextId = this._currentLevelId + 1;
            if (nextId <= 5) {
                this.startLevel(nextId);
            } else {
                this.showMainMenu();
            }
        }, 'primary');
        nextBtn.name = 'BtnNext';
        btnsRow.addChild(nextBtn);

        const backBtn = UIBuilder.createButton('返回菜单', 480, 48, () => {
            GameManager.instance.playSound('click');
            this.showLevelSelect();
        }, 'secondary');
        backBtn.setPosition(0, -350, 0);
        panel.addChild(backBtn);
    }

    endGame(): void {
        if (!this._gameRunning) return;
        this._gameRunning = false;

        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }

        const config = LEVEL_CONFIGS.find(l => l.id === this._currentLevelId);
        if (!config) return;

        const finalResult = this._scoreManager.calculateFinalScore(
            config.threeStarScore,
            config.twoStarScore,
            config.targetScore
        );

        const levelResult: LevelResult = {
            levelId: config.id,
            score: finalResult.finalScore,
            speedScore: finalResult.speedScore,
            accuracyScore: finalResult.accuracyScore,
            comboScore: finalResult.comboScore,
            correctCount: this._scoreManager.correctCount,
            wrongCount: this._scoreManager.wrongCount,
            maxCombo: this._scoreManager.maxCombo,
            totalTime: this._scoreManager.totalTime,
            starCount: finalResult.starCount,
            passed: finalResult.passed,
        };

        GameManager.instance.saveLevelResult(levelResult);

        setTimeout(() => this.showResultPanel(levelResult, finalResult.passed), 300);
    }

    showResultPanel(result: LevelResult, passed: boolean): void {
        const panel = this._rootNode!.getChildByName('ResultPanel');
        if (!panel) return;

        panel.active = true;
        const opacity = panel.getComponent(UIOpacity) || panel.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.3, { opacity: 255 }).start();
        panel.setScale(0.9, 0.9, 1);
        tween(panel).to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

        const title = panel.getChildByName('ResultTitle')?.getComponent(Label);
        if (title) {
            title.string = passed ? '🎉 评估通过' : '😔 继续努力';
            title.color = passed ? new Color(76, 175, 80, 255) : new Color(244, 67, 54, 255);
        }

        const starsRow = panel.getChildByName('StarsRow');
        if (starsRow) {
            starsRow.children.forEach((star, i) => {
                const sprite = star.getComponent(Sprite)!;
                sprite.spriteFrame = ResourceGenerator.getSpriteFrame(i < result.starCount ? 'icon_star' : 'icon_star_empty');

                star.setScale(0, 0, 1);
                tween(star)
                    .delay(0.2 + i * 0.15)
                    .to(0.4, { scale: Vec3.ONE }, { easing: 'backOut' })
                    .start();
            });
        }

        const finalScore = panel.getChildByPath('ScoreBg/FinalScore')?.getComponent(Label);
        if (finalScore) finalScore.string = result.score.toString();

        const speedLabel = panel.getChildByPath('StatsCol/SpeedScore')?.getComponent(Label);
        if (speedLabel) speedLabel.string = `速度分: +${result.speedScore}`;

        const total = result.correctCount + result.wrongCount;
        const acc = total > 0 ? Math.floor((result.correctCount / total) * 100) : 0;
        const accLabel = panel.getChildByPath('StatsCol/AccuracyScore')?.getComponent(Label);
        if (accLabel) accLabel.string = `准确率: ${acc}% (+${result.accuracyScore})`;

        const comboLabel = panel.getChildByPath('StatsCol/ComboScore')?.getComponent(Label);
        if (comboLabel) comboLabel.string = `最高连击: ${result.maxCombo} (+${result.comboScore})`;

        const timeLabel = panel.getChildByPath('StatsCol/TimeUsed')?.getComponent(Label);
        if (timeLabel) timeLabel.string = `用时: ${result.totalTime.toFixed(1)}秒`;

        const btnsRow = panel.getChildByName('BtnsRow');
        const nextBtn = btnsRow?.getChildByName('BtnNext');
        if (nextBtn) {
            nextBtn.active = passed && this._currentLevelId < 5;
        }

        GameManager.instance.playSound(passed ? 'levelComplete' : 'click');
    }

    showReview(): void {
        this._currentState = 'review';
        this.clearRoot();

        const bg = new Node('BG');
        bg.setContentSize(750, 1334);
        const bgSprite = bg.addComponent(Sprite);
        bgSprite.color = new Color(245, 240, 230, 255);
        this._rootNode!.addChild(bg);

        const header = new Node('Header');
        header.setPosition(0, 600, 0);
        this._rootNode!.addChild(header);

        const backBtn = UIBuilder.createButton('← 返回', 100, 44, () => {
            GameManager.instance.playSound('click');
            this.showMainMenu();
        }, 'secondary');
        backBtn.setPosition(-290, 0, 0);
        header.addChild(backBtn);

        const titleLabel = UIBuilder.createLabel('护理达标复盘', 32, new Color(60, 60, 60, 255));
        titleLabel.setPosition(0, 0, 0);
        header.addChild(titleLabel);

        const results = LEVEL_CONFIGS.map(config => {
            const result = GameManager.instance.getLevelResult(config.id);
            const passed = result?.passed || false;
            const score = result?.score || 0;
            const total = (result?.correctCount || 0) + (result?.wrongCount || 0);
            const accuracy = total > 0 ? Math.floor((result!.correctCount / total) * 100) : 0;
            const maxCombo = result?.maxCombo || 0;
            const stars = result?.starCount || 0;

            const scoreRatio = result ? Math.min(score / config.threeStarScore, 1) : 0;
            const accuracyRatio = accuracy / 100;
            const speedRatio = result && result.totalTime > 0
                ? Math.max(0, 1 - result.totalTime / config.timeLimit) : 0;
            const comboRatio = Math.min(maxCombo / 10, 1);
            const careScore = Math.floor(
                scoreRatio * 40 + accuracyRatio * 35 + speedRatio * 15 + comboRatio * 10
            );

            return { config, result, passed, score, accuracy, maxCombo, stars, careScore };
        });

        const overall = results.filter(r => r.passed);
        const avgCare = overall.length > 0
            ? Math.floor(overall.reduce((s, r) => s + r.careScore, 0) / overall.length)
            : 0;
        const totalScore = results.reduce((s, r) => s + r.score, 0);

        const statsPanel = UIBuilder.createPanel(700, 180);
        statsPanel.setPosition(0, 470, 0);
        this._rootNode!.addChild(statsPanel);

        const careLevel = this.getCareLevelName(avgCare);
        const careLabel = UIBuilder.createLabel(`综合护理评级: ${careLevel}`, 28,
            avgCare >= 80 ? new Color(76, 175, 80, 255) :
            avgCare >= 60 ? new Color(255, 152, 0, 255) :
            avgCare > 0 ? new Color(244, 67, 54, 255) : new Color(150, 150, 150, 255)
        );
        careLabel.setPosition(0, 40, 0);
        statsPanel.addChild(careLabel);

        const statsRow = new Node('StatsRow');
        statsRow.addComponent(Layout);
        const statsLayout = statsRow.getComponent(Layout)!;
        statsLayout.type = Layout.Type.HORIZONTAL;
        statsLayout.spacingX = 40;
        statsRow.setPosition(0, -30, 0);
        statsPanel.addChild(statsRow);

        const totalLabel = UIBuilder.createLabel(`总得分: ${totalScore}`, 20, new Color(74, 144, 217, 255));
        statsRow.addChild(totalLabel);

        const passLabel = UIBuilder.createLabel(`通过: ${overall.length}/${results.length}关`, 20, new Color(76, 175, 80, 255));
        statsRow.addChild(passLabel);

        const avgAcc = overall.length > 0
            ? Math.floor(overall.reduce((s, r) => s + r.accuracy, 0) / overall.length)
            : 0;
        const avgAccLabel = UIBuilder.createLabel(`平均准确率: ${avgAcc}%`, 20, new Color(33, 150, 243, 255));
        statsRow.addChild(avgAccLabel);

        const chartNode = new Node('Chart');
        chartNode.setContentSize(700, 280);
        chartNode.setPosition(0, 230, 0);
        const chartBg = chartNode.addComponent(Sprite);
        chartBg.spriteFrame = ResourceGenerator.getSpriteFrame('card_bg');
        chartBg.type = Sprite.Type.SLICED;
        this._rootNode!.addChild(chartNode);

        const chartTitle = UIBuilder.createLabel('📊 护理达标对比图', 20, new Color(100, 100, 100, 255), 0);
        chartTitle.setPosition(-320, 115, 0);
        chartNode.addChild(chartTitle);

        const g = chartNode.addComponent(Graphics);
        const chartW = 640;
        const chartH = 180;
        const barW = 80;
        const gap = 30;
        const startX = -chartW / 2 + (chartW - (results.length * (barW + gap) - gap)) / 2 + barW / 2;
        const baseY = -80;

        g.fillColor = new Color(240, 240, 240, 255);
        g.rect(-chartW / 2, baseY, chartW, 2);
        g.fill();

        results.forEach((r, i) => {
            const barH = (r.careScore / 100) * chartH;
            const x = startX + i * (barW + gap);
            const y = baseY + barH / 2;

            const color = r.stars >= 3 ? new Color(76, 175, 80, 255) :
                r.stars >= 1 ? new Color(255, 193, 7, 255) :
                    new Color(200, 200, 200, 255);

            g.fillColor = color;
            g.rect(x - barW / 2, baseY, barW, barH);
            g.fill();

            const scoreLabel = UIBuilder.createLabel(`${r.careScore}`, 16, new Color(80, 80, 80, 255));
            scoreLabel.setPosition(x, baseY + barH + 20, 0);
            chartNode.addChild(scoreLabel);

            const levelLabel = UIBuilder.createLabel(`第${i + 1}关`, 14, new Color(120, 120, 120, 255));
            levelLabel.setPosition(x, baseY - 20, 0);
            chartNode.addChild(levelLabel);
        });

        const scroll = UIBuilder.createScrollView(700, 500);
        scroll.setPosition(0, -180, 0);
        this._rootNode!.addChild(scroll);

        const content = scroll.getChildByName('View')!.getChildByName('Content')!;

        results.forEach(r => {
            const item = UIBuilder.createPanel(670, 120);
            const itemBg = item.getComponent(Sprite)!;

            if (r.careScore >= 80) itemBg.color = new Color(220, 240, 220, 255);
            else if (r.careScore >= 60) itemBg.color = new Color(255, 248, 220, 255);
            else if (r.passed) itemBg.color = new Color(255, 230, 230, 255);

            const numLabel = UIBuilder.createLabel(`${r.config.id}`, 32, new Color(74, 144, 217, 255));
            numLabel.setPosition(-280, 0, 0);
            item.addChild(numLabel);

            const nameLabel = UIBuilder.createLabel(r.config.name, 22, new Color(50, 50, 50, 255), 0);
            nameLabel.setContentSize(300, 28);
            nameLabel.setAnchorPoint(0, 0.5);
            nameLabel.setPosition(-200, 25, 0);
            item.addChild(nameLabel);

            const detailLabel = UIBuilder.createLabel(
                `得分: ${r.score} | 准确率: ${r.accuracy}% | 连击: ${r.maxCombo}`,
                16, new Color(120, 120, 120, 255), 0
            );
            detailLabel.setContentSize(350, 22);
            detailLabel.setAnchorPoint(0, 0.5);
            detailLabel.setPosition(-200, -5, 0);
            item.addChild(detailLabel);

            const careLabel = UIBuilder.createLabel(
                `护理: ${this.getCareLevelName(r.careScore)}`,
                18,
                r.careScore >= 80 ? new Color(76, 175, 80, 255) :
                r.careScore >= 60 ? new Color(255, 152, 0, 255) :
                r.careScore > 0 ? new Color(244, 67, 54, 255) : new Color(180, 180, 180, 255)
            );
            careLabel.setPosition(220, 0, 0);
            item.addChild(careLabel);

            content.addChild(item);
        });

        this.animateIn();
    }

    getCareLevelName(score: number): string {
        if (score >= 90) return 'S级 优秀';
        if (score >= 80) return 'A级 良好';
        if (score >= 60) return 'B级 合格';
        if (score >= 40) return 'C级 待提升';
        if (score > 0) return 'D级 需努力';
        return '未完成';
    }

    showSettings(): void {
        this._currentState = 'settings';
        this.clearRoot();

        const bg = new Node('BG');
        bg.setContentSize(750, 1334);
        const bgSprite = bg.addComponent(Sprite);
        bgSprite.color = new Color(245, 240, 230, 255);
        this._rootNode!.addChild(bg);

        const header = new Node('Header');
        header.setPosition(0, 600, 0);
        this._rootNode!.addChild(header);

        const backBtn = UIBuilder.createButton('← 返回', 100, 44, () => {
            GameManager.instance.playSound('click');
            this.showMainMenu();
        }, 'secondary');
        backBtn.setPosition(-290, 0, 0);
        header.addChild(backBtn);

        const titleLabel = UIBuilder.createLabel('游戏设置', 32, new Color(60, 60, 60, 255));
        titleLabel.setPosition(0, 0, 0);
        header.addChild(titleLabel);

        const panel = UIBuilder.createPanel(700, 900);
        panel.setPosition(0, 0, 0);
        this._rootNode!.addChild(panel);

        const settings = GameManager.instance.settings;

        const title1 = UIBuilder.createLabel('办公模式', 24, new Color(74, 144, 217, 255), 0);
        title1.setPosition(-300, 370, 0);
        panel.addChild(title1);

        const hint = UIBuilder.createLabel('关闭声音和震动，适合在办公室使用', 16, new Color(150, 150, 150, 255), 0);
        hint.setPosition(-300, 340, 0);
        panel.addChild(hint);

        const soundToggle = UIBuilder.createToggle('🔊 音效', settings.soundEnabled, (checked) => {
            GameManager.instance.updateSettings({ soundEnabled: checked });
            if (checked) GameManager.instance.playSound('click');
        });
        soundToggle.setPosition(-220, 260, 0);
        panel.addChild(soundToggle);

        const vibrationToggle = UIBuilder.createToggle('📳 震动反馈', settings.vibrationEnabled, (checked) => {
            GameManager.instance.updateSettings({ vibrationEnabled: checked });
            if (checked) GameManager.instance.vibrate(50);
        });
        vibrationToggle.setPosition(-220, 190, 0);
        panel.addChild(vibrationToggle);

        const animSlider = UIBuilder.createSlider('🎬 动画强度', settings.animationIntensity, (value) => {
            GameManager.instance.updateSettings({ animationIntensity: value });
        });
        animSlider.setPosition(0, 90, 0);
        panel.addChild(animSlider);

        const title2 = UIBuilder.createLabel('数据管理', 24, new Color(74, 144, 217, 255), 0);
        title2.setPosition(-300, -10, 0);
        panel.addChild(title2);

        const resetBtn = UIBuilder.createButton('重置所有游戏数据', 260, 52, () => {
            GameManager.instance.playSound('click');
            if (confirm('确定要重置所有数据吗？这将清除所有关卡进度！')) {
                GameManager.instance.resetAllData();
                alert('数据已重置！');
                this.showSettings();
            }
        }, 'danger');
        resetBtn.setPosition(0, -90, 0);
        panel.addChild(resetBtn);

        const infoTitle = UIBuilder.createLabel('关于游戏', 24, new Color(74, 144, 217, 255), 0);
        infoTitle.setPosition(-300, -180, 0);
        panel.addChild(infoTitle);

        const aboutText = [
            '养老护理入住评估经营模拟游戏',
            '版本: v1.0.0',
            '',
            '游戏目标：',
            '通过正确处理用药清单、探访记录和活动签到，',
            '提升护理评估速度和准确性。',
            '',
            '评分维度：速度、准确率、连击数',
        ].join('\n');

        const aboutLabel = UIBuilder.createLabel(aboutText, 16, new Color(100, 100, 100, 255), 0);
        aboutLabel.setContentSize(620, 280);
        aboutLabel.setAnchorPoint(0, 1);
        aboutLabel.setPosition(-300, -220, 0);
        const labelComp = aboutLabel.getComponent(Label)!;
        labelComp.lineHeight = 24;
        labelComp.horizontalAlign = 0;
        panel.addChild(aboutLabel);

        this.animateIn();
    }

    showTutorial(onComplete?: () => void): void {
        this._tutorialStep = 0;
        this._onTutorialComplete = onComplete || null;

        const overlay = UIBuilder.createOverlay();
        overlay.name = 'TutorialOverlay';
        overlay.setContentSize(750, 1334);
        overlay.setPosition(0, 0, 0);
        this._rootNode!.addChild(overlay);

        const opacity = overlay.getComponent(UIOpacity)!;
        tween(opacity).to(0.3, { opacity: 255 }).start();

        const dialog = UIBuilder.createPanel(640, 420);
        dialog.name = 'TutorialDialog';
        dialog.setPosition(0, -50, 0);
        overlay.addChild(dialog);

        dialog.setScale(0.8, 0.8, 1);
        tween(dialog).to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' }).start();

        const steps = [
            { title: '👋 欢迎来到养老护理评估中心', content: '你将扮演一名护理评估员，负责处理老人的入住评估工作。\n\n让我们从用药清单开始，熟悉基本操作。' },
            { title: '💊 用药清单', content: '这是用药清单，显示每位老人需要服用的药物。\n\n你的任务是：点击【正确】的用药条目获得分数！' },
            { title: '✅ 正确的条目', content: '包含正确药名、剂量和服用时间的条目是正确的。\n\n点击这类条目可以获得 100 分，还有连击加成！' },
            { title: '❌ 错误的条目', content: '有问题的条目千万不要点！\n\n点错会扣 50 分，并且中断连击。一定要仔细看清楚哦！' },
            { title: '🔥 连击加分', content: '连续答对可以触发连击加分！\n\n连击越高，每次得分越多。保持专注，不要出错！' },
            { title: '⏱️ 时间管理', content: '每个关卡都有时间限制。\n\n剩余时间越多，速度奖励分越高！' },
            { title: '🎯 准备好了吗？', content: '好的，评估工作即将开始！\n\n记住：快、准、稳，你就是最棒的护理员！' },
        ];

        const titleLabel = UIBuilder.createLabel(steps[0].title, 28, new Color(60, 60, 60, 255));
        titleLabel.name = 'TutorialTitle';
        titleLabel.setPosition(0, 150, 0);
        dialog.addChild(titleLabel);

        const contentLabel = UIBuilder.createLabel(steps[0].content, 20, new Color(80, 80, 80, 255), 1);
        contentLabel.name = 'TutorialContent';
        contentLabel.setContentSize(560, 160);
        const contentLabelComp = contentLabel.getComponent(Label)!;
        contentLabelComp.lineHeight = 28;
        contentLabelComp.horizontalAlign = 1;
        contentLabel.setPosition(0, 20, 0);
        dialog.addChild(contentLabel);

        const stepLabel = UIBuilder.createLabel(`1/${steps.length}`, 16, new Color(150, 150, 150, 255));
        stepLabel.name = 'TutorialStep';
        stepLabel.setPosition(-260, 170, 0);
        dialog.addChild(stepLabel);

        const skipBtn = UIBuilder.createButton('跳过', 80, 36, () => {
            this.completeTutorial();
        }, 'secondary');
        skipBtn.setPosition(260, 170, 0);
        dialog.addChild(skipBtn);

        const nextBtn = UIBuilder.createButton('下一步 →', 160, 52, () => {
            this._tutorialStep++;
            if (this._tutorialStep >= steps.length) {
                this.completeTutorial();
            } else {
                const step = steps[this._tutorialStep];
                const tLabel = dialog.getChildByName('TutorialTitle')?.getComponent(Label);
                if (tLabel) tLabel.string = step.title;
                const cLabel = dialog.getChildByName('TutorialContent')?.getComponent(Label);
                if (cLabel) cLabel.string = step.content;
                const sLabel = dialog.getChildByName('TutorialStep')?.getComponent(Label);
                if (sLabel) sLabel.string = `${this._tutorialStep + 1}/${steps.length}`;

                const nBtn = dialog.getChildByName('BtnNext')?.getComponentInChildren(Label);
                if (nBtn) nBtn.string = this._tutorialStep >= steps.length - 1 ? '开始游戏！' : '下一步 →';
            }
        }, 'primary');
        nextBtn.name = 'BtnNext';
        nextBtn.setPosition(0, -150, 0);
        dialog.addChild(nextBtn);

        (dialog as any)._tutorialSteps = steps;
    }

    completeTutorial(): void {
        GameManager.instance.tutorialCompleted = true;
        const overlay = this._rootNode?.getChildByName('TutorialOverlay');
        if (overlay) {
            overlay.destroy();
        }
        if (this._onTutorialComplete) {
            this._onTutorialComplete();
            this._onTutorialComplete = null;
        }
    }

    onDestroy() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
        }
    }
}
