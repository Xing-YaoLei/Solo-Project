import { _decorator, Component, Node, director } from 'cc';
import { GameManager } from './core/GameManager';
import { ConfigManager } from './core/ConfigManager';
import { SaveManager } from './core/SaveManager';
import { MapManager } from './core/MapManager';
import { LeaderboardManager } from './core/LeaderboardManager';
import { TrainingAnalysis } from './core/TrainingAnalysis';
import { MissionHallUI } from './ui/MissionHallUI';
import { CluePanelUI } from './ui/CluePanelUI';
import { ActionPanelUI } from './ui/ActionPanelUI';
import { ClientArchiveUI } from './ui/ClientArchiveUI';
import { TrainingRecordUI } from './ui/TrainingRecordUI';
import { LeaderboardUI } from './ui/LeaderboardUI';
import { TrialScheduleUI } from './ui/TrialScheduleUI';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    @property(Node)
    missionHallNode: Node | null = null;

    @property(Node)
    cluePanelNode: Node | null = null;

    @property(Node)
    actionPanelNode: Node | null = null;

    @property(Node)
    clientArchiveNode: Node | null = null;

    @property(Node)
    trainingRecordNode: Node | null = null;

    @property(Node)
    leaderboardNode: Node | null = null;

    @property(Node)
    trialScheduleNode: Node | null = null;

    @property(Node)
    gameScene: Node | null = null;

    private _missionHallUI: MissionHallUI | null = null;
    private _cluePanelUI: CluePanelUI | null = null;
    private _actionPanelUI: ActionPanelUI | null = null;
    private _clientArchiveUI: ClientArchiveUI | null = null;
    private _trainingRecordUI: TrainingRecordUI | null = null;
    private _leaderboardUI: LeaderboardUI | null = null;
    private _trialScheduleUI: TrialScheduleUI | null = null;

    async onLoad() {
        console.log('[GameController] Loading game...');

        await GameManager.instance.init();
        this.initUI();
        this.setupEventListeners();

        this.showMissionHall();

        console.log('[GameController] Game loaded successfully');
    }

    private initUI(): void {
        if (this.missionHallNode) {
            this._missionHallUI = this.missionHallNode.getComponent(MissionHallUI);
            this.missionHallNode.active = false;
        }

        if (this.cluePanelNode) {
            this._cluePanelUI = this.cluePanelNode.getComponent(CluePanelUI);
            this.cluePanelNode.active = false;
        }

        if (this.actionPanelNode) {
            this._actionPanelUI = this.actionPanelNode.getComponent(ActionPanelUI);
            this.actionPanelNode.active = false;
        }

        if (this.clientArchiveNode) {
            this._clientArchiveUI = this.clientArchiveNode.getComponent(ClientArchiveUI);
            this.clientArchiveNode.active = false;
        }

        if (this.trainingRecordNode) {
            this._trainingRecordUI = this.trainingRecordNode.getComponent(TrainingRecordUI);
            this.trainingRecordNode.active = false;
        }

        if (this.leaderboardNode) {
            this._leaderboardUI = this.leaderboardNode.getComponent(LeaderboardUI);
            this.leaderboardNode.active = false;
        }

        if (this.trialScheduleNode) {
            this._trialScheduleUI = this.trialScheduleNode.getComponent(TrialScheduleUI);
            this.trialScheduleNode.active = false;
        }
    }

    private setupEventListeners(): void {
        if (this._missionHallUI) {
            this._missionHallUI.node.on('caseStarted', this.onCaseStarted, this);
            this._missionHallUI.node.on('showClientArchive', this.showClientArchive, this);
            this._missionHallUI.node.on('showLeaderboard', this.showLeaderboard, this);
            this._missionHallUI.node.on('showTrainingRecord', this.showTrainingRecord, this);
        }

        if (this._actionPanelUI) {
            this._actionPanelUI.node.on('showCluePanel', this.showCluePanel, this);
            this._actionPanelUI.node.on('backToHall', this.onBackToHall, this);
            this._actionPanelUI.node.on('stageAdvanced', this.onStageAdvanced, this);
            this._actionPanelUI.node.on('caseClosed', this.onCaseClosed, this);
        }

        if (this._cluePanelUI) {
        }

        if (this._trainingRecordUI) {
            this._trainingRecordUI.node.on('retryCase', this.onRetryCase, this);
        }
    }

    public showMissionHall(): void {
        this.hideAllPanels();
        if (this._missionHallUI) {
            this._missionHallUI.show();
        }
    }

    public showCluePanel(): void {
        if (this._cluePanelUI) {
            this._cluePanelUI.show();
        }
    }

    public showClientArchive(): void {
        if (this._clientArchiveUI) {
            this._clientArchiveUI.show();
        }
    }

    public showTrainingRecord(): void {
        if (this._trainingRecordUI) {
            this._trainingRecordUI.show();
        }
    }

    public showLeaderboard(): void {
        if (this._leaderboardUI) {
            this._leaderboardUI.show();
        }
    }

    public showTrialSchedule(): void {
        if (this._trialScheduleUI) {
            this._trialScheduleUI.show();
        }
    }

    private hideAllPanels(): void {
        if (this._missionHallUI) this._missionHallUI.hide(false);
        if (this._cluePanelUI) this._cluePanelUI.hide(false);
        if (this._actionPanelUI) this._actionPanelUI.hide(false);
        if (this._clientArchiveUI) this._clientArchiveUI.hide(false);
        if (this._trainingRecordUI) this._trainingRecordUI.hide(false);
        if (this._leaderboardUI) this._leaderboardUI.hide(false);
        if (this._trialScheduleUI) this._trialScheduleUI.hide(false);
    }

    private onCaseStarted(caseId: string): void {
        console.log(`[GameController] Case started: ${caseId}`);
        this.hideAllPanels();
        
        if (this._actionPanelUI) {
            this._actionPanelUI.show();
        }

        if (this.gameScene) {
            this.gameScene.active = true;
        }
    }

    private onBackToHall(): void {
        if (GameManager.instance.isPlaying()) {
            GameManager.instance.endCase();
        }
        this.showMissionHall();
    }

    private onStageAdvanced(): void {
        console.log('[GameController] Stage advanced');
        if (this._actionPanelUI) {
            this._actionPanelUI.refreshUI();
        }
        if (this._cluePanelUI) {
            this._cluePanelUI.refreshUI();
        }
    }

    private onCaseClosed(): void {
        console.log('[GameController] Case closed');
        const record = GameManager.instance.endCase();
        if (record) {
            console.log(`[GameController] Final score: ${record.score}/${record.maxScore}`);
        }
        
        setTimeout(() => {
            this.showTrainingRecord();
        }, 500);
    }

    private onRetryCase(caseId: string): void {
        console.log(`[GameController] Retry case: ${caseId}`);
        this.hideAllPanels();
        
        const success = GameManager.instance.startCase(caseId);
        if (success && this._actionPanelUI) {
            this._actionPanelUI.show();
        }
    }

    public restartGame(): void {
        SaveManager.instance.resetSave();
        director.loadScene('MainScene');
    }

    public getGameManager(): GameManager {
        return GameManager.instance;
    }

    public getConfigManager(): ConfigManager {
        return ConfigManager.instance;
    }

    public getSaveManager(): SaveManager {
        return SaveManager.instance;
    }
}
