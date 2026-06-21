import { _decorator, Component, Node, Button, Label, director, game, Game } from 'cc';
import { GameController } from './GameController';
import { SettlementPanel } from './SettlementPanel';
import { StatisticsPanel } from './StatisticsPanel';
import { ReplaySystem } from './ReplaySystem';
import { EventDispatcher } from '../utils/EventDispatcher';
import { LEVELS } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {
    @property(Node)
    levelSelectPanel: Node | null = null;

    @property(Node)
    gameUIPanel: Node | null = null;

    @property(GameController)
    gameController: GameController | null = null;

    @property(SettlementPanel)
    settlementPanel: SettlementPanel | null = null;

    @property(StatisticsPanel)
    statisticsPanel: StatisticsPanel | null = null;

    @property(ReplaySystem)
    replaySystem: ReplaySystem | null = null;

    @property(Node)
    loadingOverlay: Node | null = null;

    @property(Label)
    loadingLabel: Node | null = null;

    private eventDispatcher: EventDispatcher = EventDispatcher.getInstance();
    private currentLevelId: number = 1;
    private isLoading: boolean = false;

    onLoad() {
        this.initEventListeners();
        this.initUI();

        if (this.settlementPanel && this.gameController) {
            this.settlementPanel.setGameController(this.gameController);
            this.settlementPanel.setCallbacks(
                this.onRestart.bind(this),
                this.onReview.bind(this),
                this.onNextLevel.bind(this),
                this.onAppeal.bind(this)
            );
        }

        game.on(Game.EVENT_HIDE, this.onGameHide.bind(this));
        game.on(Game.EVENT_SHOW, this.onGameShow.bind(this));
    }

    private initEventListeners() {
        this.eventDispatcher.on('game-over', this.onGameOver.bind(this), this);
        this.eventDispatcher.on('level-started', this.onLevelStarted.bind(this), this);
    }

    private initUI() {
        this.showLevelSelect();

        if (this.levelSelectPanel) {
            const levelButtons = this.levelSelectPanel.getComponentsInChildren(Button);
            levelButtons.forEach((button, index) => {
                button.node.on(Button.EventType.CLICK, () => {
                    this.startLevel(index + 1);
                }, this);
            });
        }

        const statsButton = this.node.getChildByName('StatsButton')?.getComponent(Button);
        if (statsButton) {
            statsButton.node.on(Button.EventType.CLICK, this.showStatistics.bind(this), this);
        }

        const replayButton = this.node.getChildByName('ReplayButton')?.getComponent(Button);
        if (replayButton) {
            replayButton.node.on(Button.EventType.CLICK, this.showReplays.bind(this), this);
        }
    }

    startLevel(levelId: number): void {
        if (this.isLoading || !LEVELS.find(l => l.id === levelId)) return;

        this.isLoading = true;
        this.currentLevelId = levelId;

        this.showLoading('正在加载关卡...');

        setTimeout(() => {
            this.performLevelStart(levelId);
        }, 50);
    }

    private performLevelStart(levelId: number): void {
        if (!this.gameController) return;

        this.hideLevelSelect();
        this.hideLoading();

        const success = this.gameController.startLevel(levelId);

        if (success) {
            this.showGameUI();
        } else {
            this.showLevelSelect();
        }

        this.isLoading = false;
    }

    private onLevelStarted(event: any): void {
    }

    private onGameOver(event: any): void {
        if (!this.settlementPanel) return;

        setTimeout(() => {
            this.settlementPanel!.show(
                event.isVictory,
                event.reason,
                event.score,
                event.totalCompensation
            );
        }, 100);
    }

    private onRestart(): void {
        if (this.isLoading) return;
        this.startLevel(this.currentLevelId);
    }

    private onReview(): void {
        if (this.replaySystem) {
            this.replaySystem.refreshReplayList();
        }
    }

    private onNextLevel(): void {
        if (this.isLoading) return;

        const nextLevelId = this.currentLevelId + 1;
        if (LEVELS.find(l => l.id === nextLevelId)) {
            this.startLevel(nextLevelId);
        } else {
            this.showLevelSelect();
        }
    }

    private onAppeal(evidence: any): void {
        if (this.gameController && this.gameController.getGameState()) {
            const gameState = this.gameController.getGameState();
            if (gameState) {
                gameState.totalCompensation = Math.max(0, gameState.totalCompensation - evidence.compensationAmount);
                gameState.totalCost = Math.max(0, gameState.totalCost - evidence.compensationAmount);
                gameState.score += evidence.compensationAmount;
            }
        }
    }

    showLevelSelect(): void {
        if (this.levelSelectPanel) {
            this.levelSelectPanel.active = true;
        }
        if (this.gameUIPanel) {
            this.gameUIPanel.active = false;
        }
    }

    hideLevelSelect(): void {
        if (this.levelSelectPanel) {
            this.levelSelectPanel.active = false;
        }
    }

    showGameUI(): void {
        if (this.gameUIPanel) {
            this.gameUIPanel.active = true;
        }
        if (this.levelSelectPanel) {
            this.levelSelectPanel.active = false;
        }
    }

    hideGameUI(): void {
        if (this.gameUIPanel) {
            this.gameUIPanel.active = false;
        }
    }

    showLoading(message: string = '加载中...'): void {
        if (this.loadingOverlay) {
            this.loadingOverlay.active = true;
        }
        if (this.loadingLabel && this.loadingLabel instanceof Label) {
            this.loadingLabel.string = message;
        }
    }

    hideLoading(): void {
        if (this.loadingOverlay) {
            this.loadingOverlay.active = false;
        }
    }

    showStatistics(): void {
        if (this.statisticsPanel) {
            this.statisticsPanel.show();
        }
    }

    showReplays(): void {
        if (this.replaySystem) {
            this.replaySystem.refreshReplayList();
        }
    }

    restartCurrentLevel(): void {
        this.onRestart();
    }

    goToMainMenu(): void {
        if (this.gameController) {
            this.gameController.togglePause();
        }
        this.showLevelSelect();
        this.hideGameUI();

        if (this.settlementPanel) {
            this.settlementPanel.hide();
        }
    }

    private onGameHide(): void {
        if (this.gameController && this.gameController.getGameState()) {
            this.gameController.togglePause();
        }
    }

    private onGameShow(): void {
    }

    getCurrentLevelId(): number {
        return this.currentLevelId;
    }

    isLevelInProgress(): boolean {
        return !!this.gameController?.getGameState() &&
               !this.gameController.getGameState()!.isGameOver;
    }

    onDestroy(): void {
        this.eventDispatcher.off('game-over', this.onGameOver.bind(this), this);
        this.eventDispatcher.off('level-started', this.onLevelStarted.bind(this), this);
        game.off(Game.EVENT_HIDE, this.onGameHide.bind(this));
        game.off(Game.EVENT_SHOW, this.onGameShow.bind(this));
    }
}
