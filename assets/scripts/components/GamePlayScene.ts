import { _decorator, Component, Node, find, Button, Label, Sprite } from 'cc';
import { GameManager } from '../core/GameManager';
import { ReservationList } from './ReservationList';
import { ReservationDetail } from './ReservationDetail';
import { ActionPanel } from './ActionPanel';
import { GameHUD } from './GameHUD';
import { ResultPanel } from './ResultPanel';
import { ScenicMap } from './ScenicMap';
import { TutorialSystem } from './TutorialSystem';
import { ToastManager } from '../utils/ToastManager';
import { SceneManager } from '../utils/SceneManager';
import { GameSaveManager } from '../data/GameSaveManager';
import { ActionType } from '../models/GameEnums';
import type { LevelData } from '../models';
const { ccclass, property } = _decorator;

@ccclass('GamePlayScene')
export class GamePlayScene extends Component {
    @property(Node)
    gameManagerNode: Node | null = null;

    @property(ReservationList)
    reservationList: ReservationList | null = null;

    @property(ReservationDetail)
    reservationDetail: ReservationDetail | null = null;

    @property(ActionPanel)
    actionPanel: ActionPanel | null = null;

    @property(GameHUD)
    gameHUD: GameHUD | null = null;

    @property(ResultPanel)
    resultPanel: ResultPanel | null = null;

    @property(ScenicMap)
    scenicMap: ScenicMap | null = null;

    @property(TutorialSystem)
    tutorialSystem: TutorialSystem | null = null;

    @property(Button)
    pauseBtn: Button | null = null;

    @property(Button)
    backBtn: Button | null = null;

    private gameManager: GameManager | null = null;
    private pendingLevel: LevelData | null = null;

    onLoad() {
        this.initGameManager();
        this.registerEvents();
    }

    start() {
        this.initScene();
    }

    private initGameManager(): void {
        if (this.gameManagerNode) {
            this.gameManager = this.gameManagerNode.getComponent(GameManager);
        }
        if (!this.gameManager) {
            const node = new Node('GameManager');
            this.gameManager = node.addComponent(GameManager);
            this.node.addChild(node);
        }
    }

    private registerEvents(): void {
        if (this.reservationList) {
            this.reservationList.setOnItemSelectedCallback((reservation) => {
                this.onReservationSelected(reservation);
            });
        }

        if (this.pauseBtn) {
            this.pauseBtn.node.on(Button.EventType.CLICK, this.onPauseClick, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBackClick, this);
        }
    }

    private initScene(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const currentLevel = gameManager.getCurrentLevel();
        if (currentLevel) {
            this.startLevel(currentLevel);
        } else {
            SceneManager.instance?.goToLevelSelect();
        }
    }

    public setPendingLevel(level: LevelData): void {
        this.pendingLevel = level;
    }

    private startLevel(level: LevelData): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        gameManager.initLevel(level);

        if (this.reservationList) {
            this.reservationList.refreshList();
            this.scheduleOnce(() => {
                this.reservationList?.selectFirstItem();
            }, 0.1);
        }

        if (this.scenicMap) {
            this.scenicMap.initMarkers();
        }

        if (this.gameHUD) {
            this.gameHUD.updateHUD();
        }

        if (level.hasTutorial && level.tutorialSteps && level.tutorialSteps.length > 0) {
            const saveManager = GameSaveManager.getInstance();
            if (!saveManager.isTutorialCompleted()) {
                this.showTutorial(level);
            }
        }
    }

    private showTutorial(level: LevelData): void {
        if (!this.tutorialSystem || !level.tutorialSteps) return;

        this.tutorialSystem.startTutorial(level.tutorialSteps, () => {
            GameSaveManager.getInstance().setTutorialCompleted(true);
        });
    }

    private onReservationSelected(reservation: any): void {
        if (this.reservationDetail) {
            this.reservationDetail.setReservation(reservation);
        }

        if (this.actionPanel) {
            this.actionPanel.updateButtonStates();
        }

        if (this.scenicMap && reservation.scenicSpotId) {
            this.scenicMap.highlightSpot(reservation.scenicSpotId);
        }

        if (this.tutorialSystem?.isTutorialActive()) {
            return;
        }
    }

    private onPauseClick(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        if (gameManager.isGamePaused()) {
            gameManager.resumeGame();
        } else {
            gameManager.pauseGame();
        }
    }

    private onBackClick(): void {
        SceneManager.instance?.goToLevelSelect();
    }

    update(deltaTime: number) {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        if (gameManager.isGameEnded() && !this.resultPanel?.isVisible()) {
            this.showGameResult();
        }
    }

    private showGameResult(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !this.resultPanel) return;

        const result = gameManager.getGameResult();
        if (result) {
            this.resultPanel.showResult(result);
        }
    }

    public refreshAfterAction(): void {
        if (this.reservationList) {
            this.reservationList.refreshList();
        }

        if (this.reservationDetail) {
            this.reservationDetail.setReservation(null);
        }

        if (this.actionPanel) {
            this.actionPanel.updateButtonStates();
        }

        if (this.scenicMap) {
            this.scenicMap.refreshAllSpots();
        }

        if (this.gameHUD) {
            this.gameHUD.updateHUD();
        }
    }
}
