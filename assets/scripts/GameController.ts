import { _decorator, Component, Node, Label, Button, ProgressBar, Sprite, Color, Vec3, tween, UIOpacity, instantiate, Prefab } from 'cc';
import { ScoreManager } from './ScoreManager';
import { NodeUtil } from './utils/NodeUtil';
import { levelManager } from './LevelManager';
import { GameManager } from './GameManager';
import { MedicineItem, VisitRecord, ActivityItem, LevelResult } from './data/ElderlyData';
const { ccclass, property } = _decorator;

export type TaskType = 'medicine' | 'visit' | 'activity';

@ccclass('GameController')
export class GameController extends Component {
    @property(Label)
    scoreLabel: Label | null = null;

    @property(Label)
    comboLabel: Label | null = null;

    @property(Label)
    timeLabel: Label | null = null;

    @property(ProgressBar)
    timeProgress: ProgressBar | null = null;

    @property(Label)
    taskCountLabel: Label | null = null;

    @property(Node)
    taskContainer: Node | null = null;

    @property(Node)
    resultPanel: Node | null = null;

    @property(Label)
    resultScoreLabel: Label | null = null;

    @property(Node)
    starsContainer: Node | null = null;

    @property(Label)
    resultAccuracyLabel: Label | null = null;

    @property(Label)
    resultComboLabel: Label | null = null;

    @property(Label)
    resultSpeedLabel: Label | null = null;

    @property(Button)
    retryButton: Button | null = null;

    @property(Button)
    nextLevelButton: Button | null = null;

    @property(Button)
    backButton: Button | null = null;

    @property(Node)
    taskTabContainer: Node | null = null;

    @property(Prefab)
    taskItemPrefab: Prefab | null = null;

    private _scoreManager: ScoreManager = new ScoreManager();
    private _currentTaskType: TaskType = 'medicine';
    private _gameRunning: boolean = false;
    private _timerInterval: number | null = null;
    private _levelStart: boolean = false;

    onLoad() {
        this._scoreManager = new ScoreManager();
        this.setupEventListeners();
    }

    start() {
        this.startLevel(GameManager.instance.currentLevelId);
    }

    setupEventListeners(): void {
        if (this.retryButton) {
            this.retryButton.node.on(Button.EventType.CLICK, this.onRetry, this);
        }
        if (this.nextLevelButton) {
            this.nextLevelButton.node.on(Button.EventType.CLICK, this.onNextLevel, this);
        }
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBack, this);
        }
    }

    startLevel(levelId: number): void {
        const loaded = levelManager.loadLevel(levelId);
        if (!loaded) {
            console.error('Failed to load level:', levelId);
            return;
        }

        const config = levelManager.currentLevel;
        if (!config) return;

        this._scoreManager.reset(config.timeLimit);
        this._gameRunning = true;
        this._levelStart = true;
        this._currentTaskType = config.taskTypes[0] as TaskType;

        this.hideResultPanel();
        this.updateUI();
        this.updateTaskTabs();
        this.refreshTaskList();

        this._scoreManager.startTimer();
        this.startTimer();

        GameManager.instance.playSound('click');
    }

    startTimer(): void {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
        }
        this._timerInterval = window.setInterval(() => {
            if (!this._gameRunning) return;
            this.updateTimeDisplay();
            if (this._scoreManager.isTimeUp) {
                this.endGame();
            }
        }, 100);
    }

    updateTimeDisplay(): void {
        const remaining = Math.ceil(this._scoreManager.remainingTime);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;

        if (this.timeLabel) {
            this.timeLabel.string = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (this.timeProgress && levelManager.currentLevel) {
            const progress = this._scoreManager.remainingTime / levelManager.currentLevel.timeLimit;
            this.timeProgress.progress = Math.max(0, progress);

            if (progress < 0.3) {
                this.timeProgress.barSprite.color = new Color(255, 80, 80, 255);
            } else if (progress < 0.6) {
                this.timeProgress.barSprite.color = new Color(255, 200, 80, 255);
            } else {
                this.timeProgress.barSprite.color = new Color(80, 200, 120, 255);
            }
        }
    }

    updateUI(): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = this._scoreManager.score.toString();
        }
        if (this.comboLabel) {
            if (this._scoreManager.combo > 1) {
                this.comboLabel.string = `连击 x${this._scoreManager.combo}`;
                this.comboLabel.node.active = true;
                this.playComboAnimation();
            } else {
                this.comboLabel.node.active = false;
            }
        }
        if (this.taskCountLabel) {
            const total = levelManager.getTotalTaskCount();
            const done = levelManager.getCompletedTaskCount();
            this.taskCountLabel.string = `${done}/${total}`;
        }
    }

    updateTaskTabs(): void {
        if (!this.taskTabContainer) return;
        const config = levelManager.currentLevel;
        if (!config) return;

        const tabs = this.taskTabContainer.children;
        const taskTypes: TaskType[] = ['medicine', 'visit', 'activity'];
        const tabNames: Record<TaskType, string> = {
            medicine: '用药清单',
            visit: '探访记录',
            activity: '活动签到',
        };

        tabs.forEach((tab, index) => {
            const type = taskTypes[index];
            const enabled = config.taskTypes.includes(type);
            tab.active = enabled;

            if (enabled) {
                const label = tab.getComponentInChildren(Label);
                if (label) {
                    label.string = tabNames[type];
                }

                const btn = tab.getComponent(Button);
                if (btn) {
                    btn.node.on(Button.EventType.CLICK, () => {
                        this.switchTaskType(type);
                    }, this);
                }
            }
        });

        this.updateTabHighlight();
    }

    updateTabHighlight(): void {
        if (!this.taskTabContainer) return;
        const taskTypes: TaskType[] = ['medicine', 'visit', 'activity'];

        this.taskTabContainer.children.forEach((tab, index) => {
            const type = taskTypes[index];
            const sprite = tab.getComponent(Sprite);
            const label = tab.getComponentInChildren(Label);

            if (type === this._currentTaskType) {
                if (sprite) sprite.color = new Color(70, 150, 255, 255);
                if (label) label.color = Color.WHITE;
            } else {
                if (sprite) sprite.color = new Color(230, 230, 230, 255);
                if (label) label.color = new Color(80, 80, 80, 255);
            }
        });
    }

    switchTaskType(type: TaskType): void {
        if (this._currentTaskType === type) return;
        this._currentTaskType = type;
        levelManager.setTaskType(type);
        this.updateTabHighlight();
        this.refreshTaskList();
        GameManager.instance.playSound('click');
    }

    refreshTaskList(): void {
        if (!this.taskContainer) return;

        this.taskContainer.removeAllChildren();

        const tasks = levelManager.getTasksByType(this._currentTaskType);

        tasks.forEach((task, index) => {
            const taskNode = this.createTaskItem(task, this._currentTaskType);
            if (taskNode) {
                this.taskContainer.addChild(taskNode);
            }
        });
    }

    createTaskItem(task: MedicineItem | VisitRecord | ActivityItem, type: TaskType): Node | null {
        if (!this.taskItemPrefab) {
            const node = new Node('TaskItem');
            node.addComponent(Sprite);
            node.addComponent(Button);

            const nameLabelNode = new Node('NameLabel');
            nameLabelNode.addComponent(Label);
            node.addChild(nameLabelNode);

            const descLabelNode = new Node('DescLabel');
            descLabelNode.addComponent(Label);
            node.addChild(descLabelNode);

            const btn = node.getComponent(Button)!;
            btn.transition = Button.Transition.COLOR;

            return node;
        }

        const node = instantiate(this.taskItemPrefab);
        const btn = node.getComponent(Button);
        if (btn) {
            btn.node.on(Button.EventType.CLICK, () => {
                this.handleTaskClick(task, type, node);
            }, this);
        }

        this.updateTaskItemDisplay(node, task, type);
        return node;
    }

    updateTaskItemDisplay(node: Node, task: any, type: TaskType): void {
        const labels = node.getComponentsInChildren(Label);
        if (labels.length >= 2) {
            switch (type) {
                case 'medicine':
                    labels[0].string = task.name;
                    labels[1].string = `${task.dosage} · ${task.time}`;
                    break;
                case 'visit':
                    labels[0].string = `${task.visitorName}（${task.visitorRelation}）`;
                    labels[1].string = task.visitTime;
                    break;
                case 'activity':
                    labels[0].string = task.name;
                    labels[1].string = `${task.time} · ${task.location}`;
                    break;
            }
        }

        if (task.processed) {
            const opacity = node.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 100;
            }
        }
    }

    handleTaskClick(task: any, type: TaskType, node: Node): void {
        if (!this._gameRunning || task.processed) return;

        const isCorrect = task.isCorrect;

        if (isCorrect) {
            const points = this._scoreManager.addCorrect(1);
            this.playCorrectAnimation(node);
            GameManager.instance.playSound('correct');
            GameManager.instance.vibrate(30);
        } else {
            const penalty = this._scoreManager.addWrong();
            this.playWrongAnimation(node);
            GameManager.instance.playSound('wrong');
            GameManager.instance.vibrate(100);
        }

        levelManager.markTaskProcessed(task.id, type);
        task.processed = true;

        this.updateUI();

        if (this._scoreManager.combo >= 3) {
            GameManager.instance.playSound('combo');
        }

        if (levelManager.isAllTasksCompleted()) {
            setTimeout(() => {
                this.endGame();
            }, 500);
        }
    }

    playCorrectAnimation(node: Node): void {
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            const originalColor = sprite.color.clone();
            tween(sprite)
                .to(0.1, { color: new Color(100, 255, 100, 255) })
                .to(0.2, { color: new Color(200, 200, 200, 150) })
                .start();
        }

        const scale = node.scale.clone();
        tween(node)
            .to(0.1, { scale: new Vec3(scale.x * 1.05, scale.y * 1.05, 1) })
            .to(0.2, { scale: scale })
            .start();
    }

    playWrongAnimation(node: Node): void {
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            tween(sprite)
                .to(0.1, { color: new Color(255, 100, 100, 255) })
                .to(0.2, { color: new Color(200, 200, 200, 150) })
                .start();
        }

        const pos = node.position.clone();
        const intensity = GameManager.instance.getAnimationMultiplier();
        tween(node)
            .by(0.05, { position: new Vec3(-10 * intensity, 0, 0) })
            .by(0.05, { position: new Vec3(20 * intensity, 0, 0) })
            .by(0.05, { position: new Vec3(-10 * intensity, 0, 0) })
            .start();
    }

    playComboAnimation(): void {
        if (!this.comboLabel) return;
        const node = this.comboLabel.node;
        const intensity = GameManager.instance.getAnimationMultiplier();

        node.stopAllActions();
        node.scale = new Vec3(1.5 * intensity, 1.5 * intensity, 1);
        tween(node)
            .to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' })
            .start();
    }

    endGame(): void {
        if (!this._gameRunning) return;
        this._gameRunning = false;

        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }

        const config = levelManager.currentLevel;
        if (!config) return;

        const result = this._scoreManager.calculateFinalScore(
            config.threeStarScore,
            config.twoStarScore,
            config.targetScore
        );

        const levelResult: LevelResult = {
            levelId: config.id,
            score: result.finalScore,
            speedScore: result.speedScore,
            accuracyScore: result.accuracyScore,
            comboScore: result.comboScore,
            correctCount: this._scoreManager.correctCount,
            wrongCount: this._scoreManager.wrongCount,
            maxCombo: this._scoreManager.maxCombo,
            totalTime: this._scoreManager.totalTime,
            starCount: result.starCount,
            passed: result.passed,
        };

        GameManager.instance.saveLevelResult(levelResult);
        this.showResultPanel(levelResult);

        if (result.passed) {
            GameManager.instance.playSound('levelComplete');
        }
    }

    showResultPanel(result: LevelResult): void {
        if (!this.resultPanel) return;
        this.resultPanel.active = true;

        if (this.resultScoreLabel) {
            this.resultScoreLabel.string = result.score.toString();
        }
        if (this.resultAccuracyLabel) {
            const total = result.correctCount + result.wrongCount;
            const accuracy = total > 0 ? Math.floor((result.correctCount / total) * 100) : 0;
            this.resultAccuracyLabel.string = `准确率: ${accuracy}%`;
        }
        if (this.resultComboLabel) {
            this.resultComboLabel.string = `最高连击: ${result.maxCombo}`;
        }
        if (this.resultSpeedLabel) {
            this.resultSpeedLabel.string = `用时: ${result.totalTime.toFixed(1)}秒`;
        }

        if (this.starsContainer) {
            const stars = this.starsContainer.children;
            stars.forEach((star, index) => {
                const sprite = star.getComponent(Sprite);
                if (sprite) {
                    if (index < result.starCount) {
                        sprite.color = new Color(255, 220, 50, 255);
                    } else {
                        sprite.color = new Color(180, 180, 180, 255);
                    }
                }
            });
        }

        const nextId = levelManager.getNextLevelId();
        if (this.nextLevelButton) {
            this.nextLevelButton.node.active = nextId !== null && result.passed;
        }
    }

    hideResultPanel(): void {
        if (this.resultPanel) {
            this.resultPanel.active = false;
        }
    }

    onRetry(): void {
        GameManager.instance.playSound('click');
        this.startLevel(GameManager.instance.currentLevelId);
    }

    onNextLevel(): void {
        const nextId = levelManager.getNextLevelId();
        if (nextId) {
            GameManager.instance.currentLevelId = nextId;
            this.startLevel(nextId);
        }
    }

    onBack(): void {
        GameManager.instance.playSound('click');
        console.log('Back to level select');
    }

    onDestroy() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
        }
    }

    get scoreManager(): ScoreManager {
        return this._scoreManager;
    }

    get isGameRunning(): boolean {
        return this._gameRunning;
    }
}
